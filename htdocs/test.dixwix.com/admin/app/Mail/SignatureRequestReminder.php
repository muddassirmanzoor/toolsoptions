<?php

namespace App\Mail;

use App\Models\SignatureReceiver;
use App\Models\SignatureRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SignatureRequestReminder extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SignatureRequest $signatureRequest,
        public SignatureReceiver $receiver
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reminder: "' . $this->signatureRequest->document_name . '" is waiting for your signature',
            replyTo: [$this->signatureRequest->user->email],
        );
    }

    public function content(): Content
    {
        $signUrl = config('app.signing_base_url')
            ? rtrim(config('app.signing_base_url'), '/') . '/signature-pdf/' . $this->receiver->token
            : url('/signature-pdf/' . $this->receiver->token);
        $expiresInDays = $this->signatureRequest->expires_at
            ? (int) now()->diffInDays($this->signatureRequest->expires_at, false)
            : 15;

        return new Content(
            view: 'emails.signature-request-reminder',
            with: [
                'signUrl' => $signUrl,
                'expiresInDays' => max(1, $expiresInDays),
            ],
        );
    }
}
