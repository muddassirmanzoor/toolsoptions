<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $payment->id }} - I Love PDF</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px; color: #111827; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        .meta { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { font-weight: 600; color: #6b7280; font-size: 13px; }
        .amount { font-size: 18px; font-weight: 700; color: #5B2CFF; }
        .footer { margin-top: 32px; font-size: 12px; color: #6b7280; }
        @media print { body { padding: 16px; } }
    </style>
</head>
<body>
    <h1>Invoice #{{ $payment->id }}</h1>
    <p class="meta">I Love PDF · {{ $payment->created_at->format('F j, Y \a\t g:i A') }}</p>

    <table>
        <tr><th>Customer</th><td>{{ $payment->user->first_name ?? $payment->user->name }} {{ $payment->user->last_name ?? '' }}</td></tr>
        <tr><th>Email</th><td>{{ $payment->user->email }}</td></tr>
        <tr><th>Description</th><td>{{ $payment->invoice_details }}</td></tr>
        <tr><th>Amount</th><td class="amount">$ {{ number_format($payment->amount, 2) }} {{ $payment->currency }}</td></tr>
        <tr><th>Status</th><td>{{ ucfirst($payment->status) }}</td></tr>
        <tr><th>Payment method</th><td>{{ $payment->payment_method === 'stripe' ? 'Card' : ucfirst($payment->payment_method) }}</td></tr>
    </table>

    <p class="footer">Thank you for your purchase. This is a record of your payment.</p>

    <script>
        (function() {
            if (window.location.hash === '#print') window.print();
        })();
    </script>
</body>
</html>
