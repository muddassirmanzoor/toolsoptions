@extends('layouts.dashboard')

@section('title', 'Signature request overview - I Love PDF')

@section('content')
<div class="dashboard-page dashboard-signature-overview-page">
    <div class="signatures-page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-2">
            <i class="fas fa-file-signature me-2" style="font-size: 1.5rem; color: var(--dashboard-orange, #ff702a);"></i>
            <h1 class="page-title mb-0">Signature request overview</h1>
        </div>
        <a href="{{ route('signatures.requests') }}" class="btn btn-outline-secondary btn-sm">
            <i class="fas fa-arrow-left me-1"></i> Back to Sent
        </a>
    </div>

    @if(session('signature_sent'))
        <div class="alert alert-success alert-dismissible fade show mt-3" role="alert">
            <i class="fas fa-check-circle me-2"></i>
            Signature request has been sent. You will be notified via email for each completed request.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <div class="tasks-card signature-overview-card mb-4 mt-4">
        <div class="signature-overview-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h2 class="signatures-section-title mb-0">Signature request overview</h2>
            <div class="d-flex align-items-center gap-2">
                @if($signatureRequest->file_path)
                    <a href="{{ route('signatures.requester.download-original', $signatureRequest->request_id) }}" class="btn btn-outline-secondary btn-sm">Download original</a>
                @endif
                @if($signatureRequest->status === 'completed' && $signatureRequest->signed_file_path)
                    <a href="{{ route('signatures.requester.download-signed', $signatureRequest->request_id) }}" class="btn btn-outline-primary btn-sm">Download signed</a>
                @endif
            </div>
        </div>

        <p class="text-muted small mb-4 mt-3">Request ID: <strong>{{ $signatureRequest->request_id }}</strong></p>

        <div class="row g-4">
            <div class="col-md-4 col-lg-3">
                <div class="signature-doc-thumbnail bg-light rounded border d-flex align-items-center justify-content-center p-4" style="min-height: 200px;">
                    <i class="fas fa-file-pdf fa-4x text-signature-accent"></i>
                </div>
                <p class="small mt-3 mb-0 fw-bold text-break">{{ $signatureRequest->document_name }}</p>
            </div>
            <div class="col-md-8 col-lg-9">
                <dl class="row mb-0 signature-overview-dl">
                    <dt class="col-sm-4">Request originator</dt>
                    <dd class="col-sm-8">
                        {{ $signatureRequest->user->name ?? 'N/A' }}<br>
                        <a href="mailto:{{ $signatureRequest->user->email }}">{{ $signatureRequest->user->email }}</a><br>
                        <span class="small text-muted">IP address: —</span>
                    </dd>

                    <dt class="col-sm-4">Created on</dt>
                    <dd class="col-sm-8">{{ $signatureRequest->formatted_created_at }} ({{ config('app.timezone', 'UTC') }})</dd>

                    <dt class="col-sm-4">Expires on</dt>
                    <dd class="col-sm-8">{{ $signatureRequest->expires_at ? $signatureRequest->expires_at->format('M d, Y, g:i:s A') . ' (' . config('app.timezone', 'UTC') . ')' : '—' }}</dd>

                    <dt class="col-sm-4">Completed on</dt>
                    <dd class="col-sm-8">{{ $signatureRequest->completed_at ? $signatureRequest->completed_at->format('M d, Y, g:i:s A') : '—' }}</dd>

                    <dt class="col-sm-4">Receivers</dt>
                    <dd class="col-sm-8">{{ $signatureRequest->receivers->count() }}</dd>

                    <dt class="col-sm-4">Status</dt>
                    <dd class="col-sm-8">
                        @php
                            $status = strtolower($signatureRequest->status);
                            $statusClass = $status === 'completed' ? 'status--completed' : ($status === 'pending' ? 'status--pending' : 'status--default');
                        @endphp
                        <span class="status-pill {{ $statusClass }}">{{ ucfirst($signatureRequest->status) }}</span>
                    </dd>

                    <dt class="col-sm-4">Digital Signature</dt>
                    <dd class="col-sm-8">No</dd>

                    <dt class="col-sm-4">Receiver order</dt>
                    <dd class="col-sm-8">{{ !empty($signatureRequest->settings['receiver_order']) ? 'Set' : 'Not set' }}</dd>

                    <dt class="col-sm-4">Signer reminders</dt>
                    <dd class="col-sm-8">{{ isset($signatureRequest->settings['reminders_days']) ? 'Every ' . $signatureRequest->settings['reminders_days'] . ' days' : '—' }}</dd>
                </dl>
            </div>
        </div>
    </div>

    <div class="tasks-card signature-signers-card mb-4">
        <h3 class="signatures-section-title">Signers</h3>
        <p class="text-muted small mb-3">Signers, validators and witnesses for this request</p>
        <div class="table-responsive">
            <table class="table tasks-table align-middle mb-0">
                <thead>
                    <tr>
                        <th scope="col">Receiver</th>
                        <th scope="col">Security settings</th>
                        <th scope="col">Last action</th>
                        <th scope="col">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($signatureRequest->receivers as $receiver)
                        <tr>
                            <td>
                                <strong>{{ $receiver->name }}</strong><br>
                                <a href="mailto:{{ $receiver->email }}" class="small">{{ $receiver->email }}</a><br>
                                <span class="badge bg-secondary">{{ ucfirst($receiver->role) }}</span>
                            </td>
                            <td>
                                <span class="text-muted small"><i class="fas fa-envelope me-1"></i><i class="fas fa-key me-1"></i><i class="fas fa-pen me-1"></i><i class="fas fa-mobile-alt"></i></span>
                            </td>
                            <td class="small">
                                @if($receiver->last_action_at)
                                    Sent on: {{ $receiver->formatted_last_action_at }}
                                @else
                                    —
                                @endif
                            </td>
                            <td>
                                @php
                                    $rStatus = strtolower($receiver->status);
                                    $rClass = $rStatus === 'signed' ? 'status--completed' : ($rStatus === 'sent' ? 'status--pending' : 'status--default');
                                @endphp
                                <span class="status-pill {{ $rClass }}">{{ ucfirst($receiver->status) }}</span>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="text-muted text-center py-3">No receivers</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <div class="tasks-card signature-events-card">
        <h3 class="signatures-section-title">Events log</h3>
        <p class="text-muted small mb-3">All events from this request</p>
        <div class="table-responsive">
            <table class="table tasks-table align-middle mb-0">
                <thead>
                    <tr>
                        <th scope="col">Date &amp; Time</th>
                        <th scope="col">Role</th>
                        <th scope="col">Who</th>
                        <th scope="col">Event</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($signatureRequest->events as $event)
                        <tr>
                            <td class="small">{{ $event->formatted_date_time }}</td>
                            <td>{{ $event->role ?? '—' }}</td>
                            <td>{{ $event->who ?? '—' }}</td>
                            <td>{{ $event->event }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="text-muted text-center py-3">No events yet</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
