<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document signed - I Love PDF</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: Arial, sans-serif; background: #f8f7fa; min-height: 100vh; margin: 0; padding: 0; }
        .thank-you-header { background: linear-gradient(135deg, #e8f4fd 0%, #d0e8fc 100%); padding: 48px 24px; text-align: center; }
        .thank-you-header h1 { font-size: 26px; font-weight: 700; color: #111; margin: 0 0 20px; }
        .btn-download-signed { background: #F56129; color: #fff !important; padding: 14px 32px; font-weight: 700; font-size: 16px; border-radius: 10px; text-decoration: none; display: inline-block; border: none; box-shadow: 0 4px 12px rgba(245,97,41,0.3); }
        .btn-download-signed:hover { background: #e04a1f; color: #fff; }
        .thank-you-body { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #fff; }
        .thank-you-body .greeting { font-size: 16px; color: #333; margin-bottom: 16px; }
        .thank-you-body .message { color: #555; line-height: 1.6; margin-bottom: 24px; }
        .doc-thumbnail { width: 120px; height: 155px; background: linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #888; font-size: 12px; text-align: center; padding: 12px; border: 1px solid #ddd; }
        .doc-thumbnail i { font-size: 48px; color: #ccc; margin-bottom: 8px; }
        .logo { font-size: 20px; font-weight: bold; color: #F56129; }
        .btn-back { color: #F56129; text-decoration: none; font-weight: 600; }
        .btn-back:hover { color: #e04a1f; }
    </style>
</head>
<body>
    <header class="thank-you-header">
        <div class="container">
            @if($signatureRequest && $receiver)
                <h1>Document signed successfully</h1>
                <a href="{{ route('signature-pdf.download-signed', ['token' => $receiver->token]) }}" class="btn-download-signed">
                    <i class="fas fa-download me-2"></i> Download signed documents
                </a>
            @else
                <h1>Document signed successfully</h1>
                @if($message)
                    <p class="mb-0 mt-2 text-muted">{{ $message }}</p>
                @else
                    <p class="mb-0 mt-2 text-muted">Your signature has been submitted successfully.</p>
                @endif
            @endif
        </div>
    </header>

    <main class="thank-you-body">
        @if($signatureRequest && $receiver)
            <div class="d-flex gap-4 flex-wrap align-items-start">
                <div class="doc-thumbnail flex-shrink-0">
                    <div>
                        <i class="fas fa-file-pdf d-block"></i>
                        <span>PDF</span>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <p class="greeting">Dear {{ $receiver->name }},</p>
                    <p class="message">
                        The signature process of <strong>{{ $signatureRequest->document_name }}</strong> has been completed.
                        Click on the button above to download the signed document.
                    </p>
                </div>
            </div>
        @else
            <p class="message">
                @if($message)
                    {{ $message }}
                @else
                    Your signature has been submitted successfully. The document requester will be notified.
                @endif
            </p>
        @endif

        <a href="{{ url('/') }}" class="btn-back">← Back to home</a>
    </main>
</body>
</html>
