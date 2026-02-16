@extends('layouts.dashboard')

@section('title', 'Signature overview - I Love PDF')

@section('content')
<div class="dashboard-page dashboard-signatures-page">
    <div class="signatures-page-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div class="d-flex align-items-center gap-2">
            <i class="fas fa-file-signature text-primary me-2" style="font-size: 1.5rem;"></i>
            <h1 class="page-title mb-0">Signature overview</h1>
        </div>
        <a href="{{ config('app.tools_url') }}/signature/" class="btn btn-new-signature" id="newSignatureBtn">
            New signature
        </a>
    </div>

    <div class="signatures-section">
        <h2 class="signatures-section-title mb-3">Summary</h2>
        <div class="row g-3 mb-4">
            <div class="col-sm-6 col-md-3">
                <a href="{{ route('signatures.requests') }}" class="text-decoration-none">
                    <div class="tasks-card p-3 h-100">
                        <div class="d-flex align-items-center justify-content-between">
                            <span class="text-muted small">Sent</span>
                            <i class="fas fa-paper-plane text-primary"></i>
                        </div>
                        <h3 class="mb-0 mt-2">{{ $sentTotal }}</h3>
                        <small class="text-muted">total requests</small>
                    </div>
                </a>
            </div>
            <div class="col-sm-6 col-md-3">
                <a href="{{ route('signatures.requests', ['status' => 'pending']) }}" class="text-decoration-none">
                    <div class="tasks-card p-3 h-100">
                        <div class="d-flex align-items-center justify-content-between">
                            <span class="text-muted small">Pending</span>
                            <i class="fas fa-clock text-warning"></i>
                        </div>
                        <h3 class="mb-0 mt-2">{{ $sentPending }}</h3>
                        <small class="text-muted">awaiting signatures</small>
                    </div>
                </a>
            </div>
            <div class="col-sm-6 col-md-3">
                <a href="{{ route('signatures.requests', ['status' => 'completed']) }}" class="text-decoration-none">
                    <div class="tasks-card p-3 h-100">
                        <div class="d-flex align-items-center justify-content-between">
                            <span class="text-muted small">Signed</span>
                            <i class="fas fa-check-circle text-success"></i>
                        </div>
                        <h3 class="mb-0 mt-2">{{ $sentCompleted }}</h3>
                        <small class="text-muted">completed</small>
                    </div>
                </a>
            </div>
            <div class="col-sm-6 col-md-3">
                <a href="{{ route('signatures.inbox') }}" class="text-decoration-none">
                    <div class="tasks-card p-3 h-100">
                        <div class="d-flex align-items-center justify-content-between">
                            <span class="text-muted small">Inbox</span>
                            <i class="fas fa-inbox text-info"></i>
                        </div>
                        <h3 class="mb-0 mt-2">{{ $inboxCount }}</h3>
                        <small class="text-muted">to sign</small>
                    </div>
                </a>
            </div>
        </div>

        <h2 class="signatures-section-title mb-3">Last activity</h2>
        <ul class="signatures-activity-tabs nav nav-pills mb-4" role="tablist">
            <li class="nav-item" role="presentation">
                <a class="nav-link {{ request()->routeIs('signatures.overview') ? 'active' : '' }}" href="{{ route('signatures.overview') }}" role="tab">Overview</a>
            </li>
            <li class="nav-item" role="presentation">
                <a class="nav-link" href="{{ route('signatures.requests') }}" role="tab">Sent</a>
            </li>
            <li class="nav-item" role="presentation">
                <a class="nav-link" href="{{ route('signatures.inbox') }}" role="tab">Inbox</a>
            </li>
            <li class="nav-item" role="presentation">
                <a class="nav-link" href="{{ route('signatures.signed') }}" role="tab">Signed</a>
            </li>
        </ul>

        @if($recentRequests->isNotEmpty())
            <div class="tasks-card signatures-requests-card">
                <div class="table-responsive">
                    <table class="table tasks-table signatures-requests-table align-middle mb-0">
                        <thead>
                            <tr>
                                <th scope="col">File</th>
                                <th scope="col">Creation Date</th>
                                <th scope="col">Status</th>
                                <th scope="col" class="text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($recentRequests as $req)
                                <tr>
                                    <td>
                                        <div class="signature-file-cell">
                                            <i class="fas fa-file-pdf text-signature-accent me-2"></i>
                                            <div>
                                                <span class="signature-doc-name">{{ $req->document_name }}</span>
                                                @if($req->receivers->isNotEmpty())
                                                    <div class="signature-sender text-signature-accent small">{{ $req->receivers->first()->name }}</div>
                                                @endif
                                            </div>
                                        </div>
                                    </td>
                                    <td class="signature-date-cell">{{ $req->formatted_created_at }}</td>
                                    <td>
                                        @php
                                            $status = strtolower($req->status);
                                            $statusClass = $status === 'completed' ? 'status--completed' : ($status === 'pending' ? 'status--pending' : ($status === 'declined' ? 'status--failed' : 'status--default'));
                                            $statusLabel = $status === 'completed' ? 'Signed' : ucfirst($status);
                                        @endphp
                                        <span class="status-pill {{ $statusClass }}">{{ $statusLabel }}</span>
                                    </td>
                                    <td class="text-end">
                                        @if($req->status === 'completed' && $req->signed_file_path)
                                            <a href="{{ route('signatures.requester.download-signed', $req->request_id) }}" class="btn btn-sm btn-outline-primary">Download</a>
                                        @else
                                            <a href="{{ route('signatures.requester.show', $req->request_id) }}" class="btn btn-sm btn-outline-secondary">View details</a>
                                        @endif
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                <div class="d-flex justify-content-end px-3 py-2 border-top">
                    <a href="{{ route('signatures.requests') }}" class="btn btn-sm btn-outline-primary">View all sent</a>
                </div>
            </div>
        @else
            <div class="tasks-card signatures-empty-card text-center py-5">
                <div class="signatures-empty-pdf-icon mb-3">
                    <i class="fas fa-file-pdf"></i>
                    <span class="signatures-empty-pdf-label">PDF</span>
                </div>
                <p class="signatures-empty-message mb-2">You have not sent any signature requests yet</p>
                <a href="{{ config('app.tools_url') }}/signature/" class="signatures-empty-link">Send your first signature request</a>
            </div>
        @endif
    </div>
</div>
@endsection
