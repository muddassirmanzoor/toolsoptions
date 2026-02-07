<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Signature completed</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 20px; font-weight: bold; color: #F56129; }
        .banner { background: linear-gradient(135deg, #e8f4fd 0%, #d0e8fc 100%); border-radius: 12px; margin: 24px 0; padding: 32px; text-align: center; }
        .banner h2 { margin: 0 0 16px; font-size: 22px; font-weight: bold; color: #111; }
        .btn-download { display: inline-block; background: #F56129; color: #fff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 8px 0; border: none; }
        .btn-download:hover { color: #fff; }
        .body-text { max-width: 560px; margin: 0 auto 24px; }
        .body-text p { margin: 0 0 16px; }
        .link-overview { font-size: 14px; color: #F56129; text-decoration: underline; margin-top: 12px; display: inline-block; }
    </style>
</head>
<body>
    <div class="header">
        <span class="logo">I Love PDF Signature</span>
    </div>
    <div class="banner">
        <h2>Signature completed</h2>
        <p class="mb-2"><strong>{{ $receiver->name }}</strong> ({{ $receiver->email }}) has signed the document <strong>{{ $signatureRequest->document_name }}</strong>.</p>
        <a href="{{ $signedDocumentUrl }}" class="btn-download">Download signed documents</a>
    </div>
    <div class="body-text">
        <p>Hello {{ $signatureRequest->user->name ?? $signatureRequest->user->email }},</p>
        <p>Click the button above to open the same page as the signer and download the signed document.</p>
        <a href="{{ $overviewUrl }}" class="link-overview">View request in dashboard</a>
    </div>
</body>
</html>
