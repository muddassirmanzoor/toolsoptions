<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\SignatureRequestInvitation;
use App\Models\SignatureRequest;
use App\Models\SignatureReceiver;
use App\Models\SignatureEvent;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SignatureRequestApiController extends Controller
{
    /**
     * Create a signature request (called when user clicks "Send to Sign" in the tool).
     */
    public function store(Request $request)
    {
        // FormData sends JSON as strings; decode so validation receives arrays
        if (is_string($request->receivers)) {
            $request->merge(['receivers' => json_decode($request->receivers, true) ?? []]);
        }
        if (is_string($request->settings)) {
            $request->merge(['settings' => json_decode($request->settings, true) ?? []]);
        }
        if (is_string($request->field_positions)) {
            $request->merge(['field_positions' => json_decode($request->field_positions, true) ?? []]);
        }

        $validated = $request->validate([
            'document_name' => ['required', 'string', 'max:255'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:51200'], // 50MB
            'receivers' => ['required', 'array', 'min:1'],
            'receivers.*.name' => ['required', 'string', 'max:255'],
            'receivers.*.email' => [
                'required',
                'email',
                'regex:/^[^\s@]+@[^\s@]+\.[^\s@]+$/', // require dot in domain (e.g. user@gmail.com not user@gmailcom)
            ],
            'receivers.*.role' => ['nullable', 'string', Rule::in(['signer', 'validator', 'witness'])],
            'settings' => ['nullable', 'array'],
            'settings.receiver_order' => ['nullable', 'boolean'],
            'settings.expires_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'settings.reminders_days' => ['nullable', 'integer', 'min:0', 'max:30'],
            'field_positions' => ['nullable', 'array'], // { "1": [{ type, x, y, width, height }], ... }
        ], [
            'receivers.*.email.regex' => 'Each receiver email must be valid (e.g. name@gmail.com with a dot before the domain extension like .com).',
        ]);

        $user = $request->user();

        // Require active subscription to send signature requests. If no payment: return 402 so frontend shows Upgrade to Premium popup.
        $hasActiveSubscription = Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->whereNotNull('ends_at')
            ->where('ends_at', '>', now())
            ->exists();
        if (!$hasActiveSubscription) {
            return response()->json([
                'payment_required' => true,
                'message' => 'Upgrade to Premium to send signature requests.',
            ], 402);
        }

        $file = $request->file('file');
        $requestId = strtoupper((string) Str::uuid());

        $expiresDays = (int) ($validated['settings']['expires_days'] ?? 15);
        $expiresAt = now()->addDays($expiresDays);

        $dir = 'signature-requests/' . $requestId;
        $storedPath = $file->storeAs($dir, 'original.pdf', 'local');

        $signatureRequest = SignatureRequest::create([
            'user_id' => $user->id,
            'request_id' => $requestId,
            'document_name' => $validated['document_name'],
            'file_path' => $storedPath,
            'status' => 'pending',
            'expires_at' => $expiresAt,
            'settings' => array_merge([
                'receiver_order' => $validated['settings']['receiver_order'] ?? false,
                'reminders_days' => $validated['settings']['reminders_days'] ?? 1,
                'field_positions' => $validated['field_positions'] ?? [],
            ], $validated['settings'] ?? []),
        ]);

        SignatureEvent::create([
            'signature_request_id' => $signatureRequest->id,
            'role' => 'Requester',
            'who' => $user->name ?? $user->email,
            'event' => 'Signature request created',
        ]);

        $order = 0;
        foreach ($validated['receivers'] as $r) {
            $receiver = SignatureReceiver::create([
                'signature_request_id' => $signatureRequest->id,
                'name' => $r['name'],
                'email' => $r['email'],
                'role' => $r['role'] ?? 'signer',
                'order' => ++$order,
                'status' => 'sent',
                'last_action_at' => now(),
                'token' => Str::random(48),
            ]);

            SignatureEvent::create([
                'signature_request_id' => $signatureRequest->id,
                'role' => 'System',
                'who' => '-',
                'event' => "An email has been sent to {$receiver->email} informing them to sign the documents",
            ]);

            try {
                Mail::to($receiver->email)->send(new SignatureRequestInvitation($signatureRequest, $receiver));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'request_id' => $signatureRequest->request_id,
            'redirect_url' => route('signatures.requester.show', ['requestId' => $signatureRequest->request_id]),
        ], 201);
    }
}
