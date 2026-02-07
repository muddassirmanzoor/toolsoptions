I ❤ PDF Signature

"{{ $signatureRequest->document_name }}" is waiting for your signature

Review and sign: {{ $signUrl }}

Dear {{ $receiver->name }},

{{ $signatureRequest->user->name ?? $signatureRequest->user->email }} ({{ $signatureRequest->user->email }}) has sent you the document "{{ $signatureRequest->document_name }}" to sign.

This request expires in {{ $expiresInDays }} days. Use the link above to open and sign the document.

Questions? Contact the sender at {{ $signatureRequest->user->email }}.

—
I ❤ PDF
