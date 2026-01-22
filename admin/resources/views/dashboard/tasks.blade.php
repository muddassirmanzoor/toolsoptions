@extends('layouts.dashboard')

@section('title', 'Last tasks - I Love PDF')

@section('content')
<div class="dashboard-page dashboard-tasks-page">
    <div class="tasks-header">
        <h1 class="page-title mb-0">Last tasks</h1>
        <div class="tasks-total">Total Files: <strong>{{ $totalFiles ?? 0 }}</strong></div>
    </div>

    <div class="tasks-notice" role="note">
        All your files will be automatically deleted 2 hours after being processed.
    </div>

    <div class="tasks-card">
        <div class="tasks-card-header">
            <h2 class="tasks-card-title">Processed Files</h2>
        </div>

        <div class="table-responsive">
            <table class="table tasks-table align-middle mb-0">
                <thead>
                    <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Tool</th>
                        <th scope="col">No Files</th>
                        <th scope="col">Status</th>
                        <th scope="col" class="text-end">Action</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse(($tasks ?? []) as $task)
                        <tr>
                            <td class="tasks-date">{{ $task['date'] ?? '—' }}</td>
                            <td>
                                <div class="tasks-tool">
                                    <span class="tool-icon" aria-hidden="true">
                                        <i class="fa-solid fa-file-pdf"></i>
                                    </span>
                                    <span class="tool-name">{{ $task['tool'] ?? '—' }}</span>
                                </div>
                            </td>
                            <td class="tasks-files">{{ $task['files'] ?? 0 }}</td>
                            <td>
                                @php
                                    $status = strtolower((string)($task['status'] ?? ''));
                                    $statusClass = $status === 'completed' ? 'status--completed' : 'status--default';
                                @endphp
                                <span class="status-pill {{ $statusClass }}">
                                    {{ $task['status'] ?? '—' }}
                                </span>
                            </td>
                            <td class="text-end">
                                <div class="task-actions">
                                    <button type="button" class="icon-btn icon-btn--danger" title="Delete" aria-label="Delete">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                    <button type="button" class="icon-btn icon-btn--primary" title="Edit" aria-label="Edit">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center text-muted py-4">No tasks found.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <div class="action-buttons">
        <button type="button" class="btn-save">Save</button>
        <a href="{{ route('dashboard') }}" class="btn-cancel" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;">Cancel</a>
    </div>
</div>
@endsection

