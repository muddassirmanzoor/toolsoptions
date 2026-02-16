<?php

namespace App\Mail;

use App\Models\SignatureReceiver;
use App\Models\SignatureRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SignatureRequestCompleted extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SignatureRequest $signatureRequest,
        public SignatureReceiver $receiver
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Document signed: "' . $this->signatureRequest->document_name . '"',
        );
    }

    public function content(): Content
    {
        $overviewUrl = route('signatures.requester.show', ['requestId' => $this->signatureRequest->request_id]);
        $signedDocumentUrl = route('signature-pdf.thank-you') . '?token=' . urlencode($this->receiver->token);
        return new Content(
            view: 'emails.signature-request-completed',
            with: [
                'overviewUrl' => $overviewUrl,
                'signedDocumentUrl' => $signedDocumentUrl,
            ],
        );
    }
}
