<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document waiting for your signature</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #fff; }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 20px; font-weight: bold; color: #111; }
        .logo-heart { color: #F56129; }
        .banner { background: linear-gradient(135deg, #e8f4fd 0%, #d0e8fc 100%); border-radius: 12px; margin: 24px 0; padding: 32px; text-align: center; }
        .banner h1 { margin: 0 0 16px; font-size: 22px; font-weight: bold; color: #111; }
        .btn-sign { display: inline-block; background: #F56129; color: #fff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 8px 0; border: none; }
        .btn-sign:hover { background: #e04a1f; color: #fff; }
        .body-text { max-width: 560px; margin: 0 auto 24px; }
        .body-text p { margin: 0 0 16px; }
        .body-text a { color: #1976d2; text-decoration: underline; }
        .footer { font-size: 12px; color: #666; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; }
        .footer p { margin: 0 0 8px; }
        .footer .heart { color: #F56129; }
    </style>
</head>
<body>
    <div class="header">
        <span class="logo">I <span class="logo-heart">❤</span> PDF Signature</span>
    </div>

    <div class="banner">
        <h1>"{{ $signatureRequest->document_name }}" is waiting for your signature</h1>
        <a href="{{ $signUrl }}" class="btn-sign">Review and sign</a>
    </div>

    <div class="body-text">
        <p>Dear {{ $receiver->name }},</p>
        <p>
            {{ $signatureRequest->user->name ?? $signatureRequest->user->email }}
            (<a href="mailto:{{ $signatureRequest->user->email }}">{{ $signatureRequest->user->email }}</a>) has sent you the document
            <strong>{{ $signatureRequest->document_name }}</strong> to sign.
        </p>
        <p>
            This request expires in {{ $expiresInDays }} days. Click the button above to open and sign the document.
        </p>
        <p style="font-size: 12px; color: #6b7280;">Questions? Contact the sender at <a href="mailto:{{ $signatureRequest->user->email }}">{{ $signatureRequest->user->email }}</a>.</p>
    </div>

    <div class="footer">
        <p>I <span class="heart">❤</span> PDF</p>
    </div>
</body>
</html>
