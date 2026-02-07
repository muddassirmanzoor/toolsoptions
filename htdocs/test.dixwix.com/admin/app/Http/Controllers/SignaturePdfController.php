<?php

namespace App\Http\Controllers;

use App\Mail\SignatureRequestCompleted;
use App\Models\SignatureReceiver;
use App\Models\SignatureRequest;
use App\Models\SignatureEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class SignaturePdfController extends Controller
{
    /**
     * API for Node signing page (port 3000): return session data by token.
     */
    public function session(string $token)
    {
        $receiver = SignatureReceiver::where('token', $token)->with('signatureRequest')->firstOrFail();
        $request = $receiver->signatureRequest;

        if ($request->status === 'completed') {
            return response()->json(['redirect' => route('signature-pdf.thank-you') . '?token=' . urlencode($token)], 302);
        }
        if ($request->expires_at && $request->expires_at->isPast()) {
            return response()->json(['redirect' => route('signature-pdf.thank-you') . '?token=' . urlencode($token) . '&expired=1'], 410);
        }

        // Use request host so document/sign URLs work from Node (3000) or any client
        $base = rtrim(request()->getSchemeAndHttpHost(), '/');
        $response = response()->json([
            'token' => $token,
            'document_url' => $base . route('signature-pdf.document', ['token' => $token], false),
            'field_positions' => $request->settings['field_positions'] ?? [],
            'receiver_name' => $receiver->name ?? '',
            'document_name' => $request->document_name ?? 'document.pdf',
            'sign_url' => $base . route('signature-pdf.sign', ['token' => $token], false),
            'thank_you_url' => $base . route('signature-pdf.thank-you', [], false) . '?token=' . urlencode($token),
        ]);
        $response->header('Access-Control-Allow-Origin', request()->header('Origin') ?: '*');
        return $response;
    }

    /**
     * Guest signing page: T&C then sign UI.
     */
    public function show(string $token)
    {
        $receiver = SignatureReceiver::where('token', $token)->with('signatureRequest.user')->firstOrFail();
        $request = $receiver->signatureRequest;

        // When Node signing view (port 3000) is configured, redirect so signers open the same view as tools
        $signingBaseUrl = config('app.signing_base_url');
        if ($signingBaseUrl) {
            $nodeSignUrl = rtrim($signingBaseUrl, '/') . '/signature-pdf/' . $token;
            return redirect()->away($nodeSignUrl);
        }

        if ($request->status === 'completed') {
            return redirect(route('signature-pdf.thank-you') . '?token=' . urlencode($token));
        }
        if ($request->expires_at && $request->expires_at->isPast()) {
            return redirect(route('signature-pdf.thank-you') . '?token=' . urlencode($token) . '&expired=1')->with('message', 'This signature request has expired.');
        }

        SignatureEvent::create([
            'signature_request_id' => $request->id,
            'role' => 'Signer',
            'who' => $receiver->name ?: $receiver->email,
            'event' => 'Document viewed',
        ]);

        return view('signature-pdf.guest-sign', [
            'token' => $token,
            'receiver' => $receiver,
            'signatureRequest' => $request,
            'documentUrl' => route('signature-pdf.document', ['token' => $token]),
            'acceptTermsUrl' => route('signature-pdf.accept-terms', ['token' => $token]),
            'signUrl' => route('signature-pdf.sign', ['token' => $token]),
        ]);
    }

    /**
     * Record terms acceptance (optional; we can also just require checkbox on submit).
     */
    public function acceptTerms(Request $request, string $token)
    {
        $receiver = SignatureReceiver::where('token', $token)->firstOrFail();
        // Could add terms_accepted_at to receivers table; for now we rely on session/checkbox
        return response()->json(['accepted' => true]);
    }

    /**
     * Serve the PDF for the guest viewer (token required).
     * Read into memory and set Content-Length explicitly to avoid ERR_CONTENT_LENGTH_MISMATCH
     * when the response is proxied or buffered (e.g. from Node/fetch).
     */
    public function document(string $token)
    {
        $receiver = SignatureReceiver::where('token', $token)->with('signatureRequest')->firstOrFail();
        $request = $receiver->signatureRequest;

        // Serve latest version: signed PDF if any previous signer has signed, else original
        $filePath = $request->signed_file_path && Storage::disk('local')->exists($request->signed_file_path)
            ? $request->signed_file_path
            : $request->file_path;

        if (!$filePath || !Storage::disk('local')->exists($filePath)) {
            abort(404, 'Document not found');
        }

        $content = Storage::disk('local')->get($filePath);
        $name = $request->document_name;
        if (!str_ends_with(strtolower($name), '.pdf')) {
            $name .= '.pdf';
        }

        $headers = [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $name . '"',
            'Content-Length' => (string) strlen($content),
        ];
        $response = response($content, 200, $headers);
        $response->headers->set('Access-Control-Allow-Origin', request()->header('Origin') ?: '*');
        return $response;
    }

    /**
     * Submit signature: receive signed PDF (base64) and metadata.
     */
    public function sign(Request $request, string $token)
    {
        $validated = $request->validate([
            'signer_name' => ['required', 'string', 'max:255'],
            'signed_pdf_base64' => ['required', 'string'], // PDF signed in browser with pdf-lib
        ]);

        $receiver = SignatureReceiver::where('token', $token)->with('signatureRequest.user')->firstOrFail();
        $signatureRequest = $receiver->signatureRequest;

        if ($signatureRequest->status === 'completed') {
            $r = response()->json(['message' => 'Already signed.', 'redirect' => url('/')], 400);
            $r->headers->set('Access-Control-Allow-Origin', request()->header('Origin') ?: '*');
            return $r;
        }
        if ($signatureRequest->expires_at && $signatureRequest->expires_at->isPast()) {
            $r = response()->json(['message' => 'Request expired.', 'redirect' => url('/')], 400);
            $r->headers->set('Access-Control-Allow-Origin', request()->header('Origin') ?: '*');
            return $r;
        }

        $pdfBase64 = $validated['signed_pdf_base64'];
        $pdfBytes = base64_decode(preg_replace('#^data:application/pdf;base64,#', '', $pdfBase64), true);
        if ($pdfBytes === false || strlen($pdfBytes) < 100) {
            $r = response()->json(['message' => 'Invalid PDF data.'], 422);
            $r->headers->set('Access-Control-Allow-Origin', request()->header('Origin') ?: '*');
            return $r;
        }

        $dir = dirname($signatureRequest->file_path);
        $signedPath = $dir . '/signed.pdf';
        Storage::disk('local')->put($signedPath, $pdfBytes);

        $receiver->update([
            'status' => 'signed',
            'signed_at' => now()->format('m/d/Y'),
        ]);

        $signatureRequest->update(['signed_file_path' => $signedPath]);

        $allSigned = $signatureRequest->receivers()->where('status', '!=', 'signed')->count() === 0;
        if ($allSigned) {
            $signatureRequest->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        }

        SignatureEvent::create([
            'signature_request_id' => $signatureRequest->id,
            'role' => 'Signer',
            'who' => $validated['signer_name'],
            'event' => 'Document signed by ' . $validated['signer_name'],
        ]);

        try {
            Mail::to($signatureRequest->user->email)->send(new SignatureRequestCompleted($signatureRequest, $receiver));
        } catch (\Throwable $e) {
            report($e);
        }

        try {
            Mail::to($receiver->email)->send(new \App\Mail\SignatureSignedConfirmation($signatureRequest, $receiver));
        } catch (\Throwable $e) {
            report($e);
        }

        $response = response()->json([
            'message' => 'Document signed successfully.',
            'redirect' => route('signature-pdf.thank-you') . '?token=' . urlencode($token),
        ]);
        $response->headers->set('Access-Control-Allow-Origin', request()->header('Origin') ?: '*');
        return $response;
    }

    /**
     * Thank-you page after signing (optional token for personalized view and download).
     */
    public function thankYou(Request $request)
    {
        $token = $request->query('token');
        $receiver = null;
        $signatureRequest = null;

        if ($token) {
            $receiver = SignatureReceiver::where('token', $token)->with('signatureRequest')->first();
            if ($receiver) {
                $signatureRequest = $receiver->signatureRequest;
            }
        }

        return view('signature-pdf.thank-you', [
            'receiver' => $receiver,
            'signatureRequest' => $signatureRequest,
            'message' => session('message'),
        ]);
    }

    /**
     * Download signed document (for signer from thank-you page).
     */
    public function downloadSigned(string $token)
    {
        $receiver = SignatureReceiver::where('token', $token)->with('signatureRequest')->firstOrFail();
        $request = $receiver->signatureRequest;

        $filePath = $request->signed_file_path && Storage::disk('local')->exists($request->signed_file_path)
            ? $request->signed_file_path
            : $request->file_path;

        if (!$filePath || !Storage::disk('local')->exists($filePath)) {
            abort(404, 'Document not found');
        }

        $path = Storage::disk('local')->path($filePath);
        $name = pathinfo($request->document_name, PATHINFO_FILENAME) . '_signed.pdf';
        if (!str_ends_with(strtolower($name), '.pdf')) {
            $name .= '.pdf';
        }

        return response()->download($path, $name, [
            'Content-Type' => 'application/pdf',
        ]);
    }
}
