@extends('layouts.dashboard')

@section('title', 'Invoice history - I Love PDF')

@push('styles')
<style>
    .dashboard-invoices-page .invoices-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 16px;
        margin: 26px 0 18px;
        flex-wrap: wrap;
    }
    .dashboard-invoices-page .invoices-total {
        font-size: 14px;
        font-weight: 600;
        color: var(--dashboard-gray-dark);
        white-space: nowrap;
    }
    .dashboard-invoices-page .invoices-notice {
        background: rgba(91, 44, 255, 0.08);
        border: 1px solid rgba(91, 44, 255, 0.2);
        color: var(--dashboard-gray-dark);
        border-radius: 12px;
        padding: 18px 20px;
        margin-bottom: 24px;
        font-size: 14px;
    }
    .invoices-empty-state .empty-state-icon { color: var(--dashboard-purple); }
    .payment-method-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: rgba(17, 24, 39, 0.06);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--dashboard-gray-dark);
    }
    .payment-method-icon.paypal { color: #003087; }
    .invoices-action-buttons { margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; }
    .btn-save { background: var(--dashboard-orange); color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; }
    .btn-cancel { background: var(--dashboard-gray-dark); color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; }
    @media (max-width: 768px) {
        .dashboard-invoices-page .invoices-header { flex-direction: column; align-items: flex-start; }
    }
</style>
@endpush

@section('content')
<div class="dashboard-page dashboard-invoices-page">
    <div class="invoices-header">
        <h1 class="page-title mb-0">Invoice history</h1>
        @if($invoices->count() > 0)
            <div class="invoices-total">Total Invoices: <strong>{{ $totalInvoices }}</strong></div>
        @endif
    </div>

    @if($invoices->count() > 0)
        <div class="invoices-notice" role="note">
            Your payment history from Premium and Signature packages. Download invoices for your records.
        </div>

        <div class="tasks-card">
            <div class="tasks-card-header">
                <h2 class="tasks-card-title">Invoices</h2>
            </div>

            <div class="table-responsive">
                <table class="table tasks-table align-middle mb-0">
                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Details</th>
                            <th scope="col">Amount</th>
                            <th scope="col">Payment Method</th>
                            <th scope="col">Status</th>
                            <th scope="col" class="text-end">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($invoices as $inv)
                            <tr>
                                <td>{{ $inv->created_at->format('M j, Y') }}</td>
                                <td>
                                    <div class="tasks-tool">
                                        <span class="tool-icon" aria-hidden="true">
                                            <i class="fa-solid fa-file-invoice"></i>
                                        </span>
                                        <span class="tool-name">{{ $inv->invoice_details }}</span>
                                    </div>
                                </td>
                                <td><strong>$ {{ number_format($inv->amount, 2) }}</strong></td>
                                <td>
                                    @if(strtolower($inv->payment_method) === 'paypal')
                                        <span class="payment-method-icon paypal" title="PayPal">
                                            <i class="fab fa-cc-paypal"></i>
                                        </span>
                                    @else
                                        <span class="payment-method-icon" title="Card">
                                            <i class="fa-solid fa-credit-card"></i>
                                        </span>
                                    @endif
                                </td>
                                <td>
                                    @php
                                        $s = strtolower($inv->status);
                                        $statusClass = $s === 'completed' ? 'status--completed' : ($s === 'failed' ? 'status--failed' : 'status--default');
                                        $statusText = $s === 'completed' ? 'Completed' : ucfirst($s);
                                    @endphp
                                    <span class="status-pill {{ $statusClass }}">{{ $statusText }}</span>
                                </td>
                                <td class="text-end">
                                    <div class="task-actions">
                                        <a href="{{ route('dashboard.invoices.download', $inv->id) }}" target="_blank" class="icon-btn icon-btn--primary" title="Download invoice" aria-label="Download">
                                            <i class="fa-solid fa-download"></i>
                                        </a>
                                        <form action="{{ route('dashboard.invoices.hide', $inv->id) }}" method="POST" class="d-inline" onsubmit="return confirm('Remove this invoice from your history?');">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="icon-btn icon-btn--danger" title="Remove" aria-label="Remove">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>

        <div class="invoices-action-buttons">
            <button type="button" class="btn-cancel" onclick="window.location.href='{{ route('dashboard.plans') }}'">Cancel</button>
            <button type="button" class="btn-save" style="display: none;">Save</button>
        </div>
    @else
        <div class="tasks-empty-state invoices-empty-state">
            <div class="empty-state-icon">
                <i class="fa-solid fa-file-invoice"></i>
            </div>
            <h2 class="empty-state-title">No invoices yet</h2>
            <p class="empty-state-description">
                When you upgrade to Premium or purchase Signature packages, your invoices will appear here.
            </p>
            <div class="empty-state-info">
                <p class="empty-state-info-text">
                    <a href="{{ route('dashboard.premium') }}" class="text-decoration-none fw-semibold" style="color: var(--dashboard-purple);">Go to Premium</a> or
                    <a href="{{ route('dashboard.plans') }}" class="text-decoration-none fw-semibold" style="color: var(--dashboard-purple);">Plans & Packages</a> to get started.
                </p>
            </div>
        </div>
    @endif
</div>
@endsection
