<?php

namespace App\Mail;

use App\Models\SignatureReceiver;
use App\Models\SignatureRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SignatureSignedConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SignatureRequest $signatureRequest,
        public SignatureReceiver $receiver
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '"' . $this->signatureRequest->document_name . '" has been successfully signed',
        );
    }

    public function content(): Content
    {
        $thankYouUrl = route('signature-pdf.thank-you') . '?token=' . urlencode($this->receiver->token);
        return new Content(
            view: 'emails.signature-signed-confirmation',
            with: ['thankYouUrl' => $thankYouUrl],
        );
    }
}
