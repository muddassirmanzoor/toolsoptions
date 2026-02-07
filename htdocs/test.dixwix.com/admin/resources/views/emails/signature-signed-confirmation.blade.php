<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document signed</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #fff; }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 20px; font-weight: bold; color: #111; }
        .logo-heart { color: #F56129; }
        .banner { background: linear-gradient(135deg, #e8f4fd 0%, #d0e8fc 100%); border-radius: 12px; margin: 24px 0; padding: 32px; text-align: center; }
        .banner h1 { margin: 0 0 16px; font-size: 22px; font-weight: bold; color: #111; }
        .btn-download { display: inline-block; background: #F56129; color: #fff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 8px 0; border: none; }
        .btn-download:hover { background: #e04a1f; color: #fff; }
        .body-text { max-width: 560px; margin: 0 auto 24px; }
        .body-text p { margin: 0 0 16px; }
        .footer { font-size: 12px; color: #666; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <span class="logo">I <span class="logo-heart">❤</span> PDF Signature</span>
    </div>

    <div class="banner">
        <h1>"{{ $signatureRequest->document_name }}" has been successfully signed</h1>
        <a href="{{ $thankYouUrl }}" class="btn-download">Download signed document</a>
    </div>

    <div class="body-text">
        <p>Dear {{ $receiver->name }},</p>
        <p>
            The signature process of <strong>{{ $signatureRequest->document_name }}</strong> has been completed.
            Click on the button above to download the signed document.
        </p>
    </div>

    <div class="footer">
        <p>I <span style="color: #F56129;">❤</span> PDF</p>
    </div>
</body>
</html>
