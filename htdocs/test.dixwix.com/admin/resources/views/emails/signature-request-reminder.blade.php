<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reminder - Signature request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 20px; font-weight: bold; color: #e63946; }
        .cta-box { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 32px; border-radius: 12px; margin: 24px 0; text-align: center; }
        .cta-box h2 { margin: 0 0 16px; font-size: 22px; }
        .btn-review { display: inline-block; background: #e63946; color: #fff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 8px 0; }
        .btn-review:hover { background: #c1121f; }
        .body-text { max-width: 560px; margin: 0 auto 24px; }
        .footer { font-size: 12px; color: #666; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <span class="logo">I Love PDF Signature</span>
    </div>

    <div class="cta-box">
        <h2>Reminder: Please sign this document</h2>
        <a href="{{ $signUrl }}" class="btn-review">Review and sign</a>
    </div>

    <div class="body-text">
        <p>Dear {{ $receiver->name }},</p>
        <p>
            This is a reminder that {{ $signatureRequest->user->name ?? $signatureRequest->user->email }}
            ({{ $signatureRequest->user->email }}) is still waiting for your signature on the document
            <strong>{{ $signatureRequest->document_name }}</strong>.
        </p>
        <p>
            This request will expire in {{ $expiresInDays }} days. Please click the button above to sign.
        </p>
        <p>
            Do not share this email or the link with anyone else.
        </p>
    </div>

    <div class="footer">
        <p>I Love PDF</p>
    </div>
</body>
</html>
