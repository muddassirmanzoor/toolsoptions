@extends('layouts.dashboard')

@section('title', 'Signatures - I Love PDF')

@section('content')
<div class="dashboard-page dashboard-signatures-page">
    @if(isset($showLanding) && $showLanding)
        {{-- Figma landing: Sent with zero sent requests --}}
        <h1 class="page-title mb-4">Signatures</h1>

        <div class="signatures-last-activity">
            <h2 class="signatures-card-title mb-3">Last activity</h2>
            <ul class="signatures-activity-tabs nav nav-pills mb-4" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" type="button" role="tab" aria-selected="true">Sent</button>
                </li>
                <li class="nav-item" role="presentation">
                    <a class="nav-link" href="#" role="tab">Inbox</a>
                </li>
                <li class="nav-item" role="presentation">
                    <a class="nav-link" href="#" role="tab">Signed</a>
                </li>
            </ul>

            <div class="tasks-card signatures-empty-landing text-center py-5">
                <div class="signatures-empty-pdf-icon mb-3">
                    <i class="fas fa-file-pdf"></i>
                    <span class="signatures-empty-pdf-label">PDF</span>
                </div>
                <p class="signatures-empty-message mb-2">You have not sent any signature requests yet</p>
                <a href="http://82.180.132.134:3000/signature/" class="signatures-empty-link">Send Your First Signature Request</a>
            </div>
        </div>
    @else
        {{-- List view: Sent with data OR Inbox (dynamic entries from DB) --}}
        <div class="signatures-page-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div class="d-flex align-items-center gap-2">
                <i class="fas fa-file-signature text-primary me-2" style="font-size: 1.5rem;"></i>
                <h1 class="page-title mb-0">I Love PDF Signature</h1>
            </div>
            <a href="http://82.180.132.134:3000/signature/" class="btn btn-new-signature" id="newSignatureBtn">
                New signature
            </a>
        </div>

        <div class="signatures-section">
            <h2 class="signatures-section-title mb-3">{{ isset($isSigned) && $isSigned ? 'Signed' : (isset($isInbox) && $isInbox ? 'Inbox' : 'Signature requests') }}</h2>

            <div class="signatures-toolbar d-flex flex-wrap align-items-center gap-2 mb-3">
                <div class="dropdown">
                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-filter me-1"></i> Filters
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="{{ request()->fullUrlWithQuery(['status' => '']) }}">All</a></li>
                        <li><a class="dropdown-item" href="{{ request()->fullUrlWithQuery(['status' => 'pending']) }}">Pending</a></li>
                        <li><a class="dropdown-item" href="{{ request()->fullUrlWithQuery(['status' => 'completed']) }}">Signed</a></li>
                    </ul>
                </div>
                <form action="{{ isset($isSigned) && $isSigned ? route('signatures.signed') : (isset($isInbox) && $isInbox ? route('signatures.inbox') : route('signatures.requests')) }}" method="GET" class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 320px;">
                    @if(request('status'))
                        <input type="hidden" name="status" value="{{ request('status') }}">
                    @endif
                    <input type="text" name="search" class="form-control form-control-sm" placeholder="Search here..." value="{{ request('search') }}">
                    <button type="submit" class="btn btn-outline-secondary btn-sm" aria-label="Search">
                        <i class="fas fa-search"></i>
                    </button>
                </form>
            </div>

            @if($requests->count() > 0)
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
                                @foreach($requests as $req)
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
                                        <td class="signature-date-cell">
                                            <span>{{ $req->formatted_created_at }}</span>
                                            @if($req->status === 'completed' && $req->completed_at)
                                                <div class="text-success small">Signed on {{ $req->completed_at->format('m/d/Y') }}</div>
                                            @elseif($req->expires_at)
                                                <div class="text-warning small">Expires on {{ $req->formatted_expires_at }}</div>
                                            @endif
                                        </td>
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
                    @if($requests->hasPages())
                        <div class="d-flex justify-content-between align-items-center px-3 py-2 border-top">
                            <small class="text-muted">
                                {{ $requests->firstItem() }}-{{ $requests->lastItem() }} of {{ $requests->total() }}
                            </small>
                            <div>{{ $requests->links() }}</div>
                        </div>
                    @endif
                </div>
            @else
                <div class="tasks-card signatures-empty-card text-center py-5">
                    <div class="empty-state-icon mb-3">
                        <i class="fas fa-file-pdf fa-4x text-muted"></i>
                    </div>
                    <h3 class="h5 mb-2">You have not sent any signature requests yet</h3>
                    <a href="http://82.180.132.134:3000/signature/" class="btn btn-new-signature btn-sm">Send your first signature request</a>
                </div>
            @endif
        </div>
    @endif
</div>
@endsection
