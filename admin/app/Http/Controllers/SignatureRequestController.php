<?php

namespace App\Http\Controllers;

use App\Models\SignatureRequest;
use App\Models\SignatureEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SignatureRequestController extends Controller
{
    /**
     * Signature overview – summary counts and quick links to Sent, Inbox, Signed.
     */
    public function overview(Request $request)
    {
        $userId = $request->user()->id;
        $userEmail = $request->user()->email;

        $sentTotal = SignatureRequest::where('user_id', $userId)->count();
        $sentPending = SignatureRequest::where('user_id', $userId)->where('status', 'pending')->count();
        $sentCompleted = SignatureRequest::where('user_id', $userId)->where('status', 'completed')->count();
        $inboxCount = SignatureRequest::whereHas('receivers', function ($q) use ($userEmail) {
            $q->where('email', $userEmail);
        })->count();

        $recentRequests = SignatureRequest::where('user_id', $userId)
            ->with(['receivers'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return view('dashboard.signatures.overview', [
            'sentTotal' => $sentTotal,
            'sentPending' => $sentPending,
            'sentCompleted' => $sentCompleted,
            'inboxCount' => $inboxCount,
            'recentRequests' => $recentRequests,
        ]);
    }

    /**
     * List sent signature requests (Sent tab).
     */
    public function index(Request $request)
    {
        $query = SignatureRequest::where('user_id', $request->user()->id)
            ->with(['receivers'])
            ->withCount('receivers')
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('document_name', 'like', "%{$term}%")
                    ->orWhere('request_id', 'like', "%{$term}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->paginate(10)->withQueryString();

        // Show Figma landing only on Sent when user has zero sent requests
        $showLanding = $requests->total() === 0;

        return view('dashboard.signatures.requests', [
            'requests' => $requests,
            'showLanding' => $showLanding,
        ]);
    }

    /**
     * Signed: sent signature requests with status completed (signed by all).
     */
    public function signed(Request $request)
    {
        $query = SignatureRequest::where('user_id', $request->user()->id)
            ->where('status', 'completed')
            ->with(['receivers'])
            ->withCount('receivers')
            ->orderByDesc('updated_at');

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('document_name', 'like', "%{$term}%")
                    ->orWhere('request_id', 'like', "%{$term}%");
            });
        }

        $requests = $query->paginate(10)->withQueryString();

        return view('dashboard.signatures.requests', [
            'requests' => $requests,
            'isSigned' => true,
            'showLanding' => false,
        ]);
    }

    /**
     * Inbox: signature requests where the user is a receiver.
     */
    public function inbox(Request $request)
    {
        $query = SignatureRequest::whereHas('receivers', function ($q) use ($request) {
            $q->where('email', $request->user()->email);
        })->with(['receivers', 'user'])->withCount('receivers')->orderByDesc('created_at');

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('document_name', 'like', "%{$term}%")->orWhere('request_id', 'like', "%{$term}%");
            });
        }

        $requests = $query->paginate(10)->withQueryString();

        return view('dashboard.signatures.requests', [
            'requests' => $requests,
            'isInbox' => true,
            'showLanding' => false,
        ]);
    }

    /**
     * Signature request overview (requester view) – signers + events log.
     */
    public function show(Request $request, string $requestId)
    {
        $signatureRequest = SignatureRequest::where('request_id', $requestId)
            ->where('user_id', $request->user()->id)
            ->with(['receivers', 'events', 'user'])
            ->firstOrFail();

        return view('dashboard.signatures.requester-show', [
            'signatureRequest' => $signatureRequest,
        ]);
    }

    /**
     * Download original PDF (requester).
     */
    public function downloadOriginal(Request $request, string $requestId): StreamedResponse
    {
        $signatureRequest = SignatureRequest::where('request_id', $requestId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if (!$signatureRequest->file_path || !Storage::disk('local')->exists($signatureRequest->file_path)) {
            abort(404, 'File not found');
        }

        $path = Storage::disk('local')->path($signatureRequest->file_path);
        $name = $signatureRequest->document_name;
        if (!str_ends_with(strtolower($name), '.pdf')) {
            $name .= '.pdf';
        }

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $name . '"',
        ]);
    }

    /**
     * Download signed PDF (requester).
     */
    public function downloadSigned(Request $request, string $requestId): StreamedResponse
    {
        $signatureRequest = SignatureRequest::where('request_id', $requestId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($signatureRequest->status !== 'completed' || !$signatureRequest->signed_file_path) {
            abort(404, 'Signed file not available');
        }
        if (!Storage::disk('local')->exists($signatureRequest->signed_file_path)) {
            abort(404, 'File not found');
        }

        $path = Storage::disk('local')->path($signatureRequest->signed_file_path);
        $name = 'signed_' . $signatureRequest->document_name;
        if (!str_ends_with(strtolower($name), '.pdf')) {
            $name .= '.pdf';
        }

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $name . '"',
        ]);
    }
}
