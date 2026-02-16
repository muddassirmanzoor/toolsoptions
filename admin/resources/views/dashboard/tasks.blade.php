@extends('layouts.dashboard')

@section('title', 'Last tasks - I Love PDF')

@section('content')
<div class="dashboard-page dashboard-tasks-page">
    <div class="tasks-header">
        <h1 class="page-title mb-0">Last tasks</h1>
        @if($tasks->count() > 0)
            <div class="tasks-total">Total Files: <strong>{{ $totalFiles }}</strong></div>
        @endif
    </div>

    @if($tasks->count() > 0)
        <div class="tasks-notice" role="note">
            Files are kept in your history. Deleted files are hidden but can be restored if needed.
        </div>

        <div class="tasks-card">
            <div class="tasks-card-header">
                <h2 class="tasks-card-title">Processed files</h2>
            </div>

            <div class="table-responsive">
                <table class="table tasks-table align-middle mb-0">
                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Tool</th>
                            <th scope="col">N° Files</th>
                            <th scope="col">Status</th>
                            <th scope="col" class="text-end">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($tasks as $task)
                            <tr>
                                <td class="tasks-date">{{ $task->formatted_date_time }}</td>
                                <td>
                                    <div class="tasks-tool">
                                        <span class="tool-icon" aria-hidden="true">
                                            <i class="fa-solid fa-file-pdf"></i>
                                        </span>
                                        <span class="tool-name">{{ $task->tool_name }}</span>
                                    </div>
                                </td>
                                <td class="tasks-files">{{ $task->file_count }}</td>
                                <td>
                                    @php
                                        $status = strtolower($task->status);
                                        $statusClass = $status === 'completed' ? 'status--completed' : ($status === 'failed' ? 'status--failed' : 'status--default');
                                        $statusText = $status === 'completed' ? 'Successful Task' : ucfirst($status);
                                    @endphp
                                    <span class="status-pill {{ $statusClass }}">
                                        {{ $statusText }}
                                    </span>
                                </td>
                                <td class="text-end">
                                    <div class="task-actions">
                                        <form action="{{ route('dashboard.tasks.delete', $task->id) }}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this file?');">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="icon-btn icon-btn--danger" title="Delete" aria-label="Delete">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </form>
                                        @if($task->file_path && $task->status === 'completed')
                                            <a href="{{ route('dashboard.tasks.download', $task->id) }}" class="icon-btn icon-btn--primary" title="Download" aria-label="Download">
                                                <i class="fa-solid fa-download"></i>
                                            </a>
                                        @endif
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    @else
        <!-- Empty State -->
        <div class="tasks-empty-state">
            <div class="empty-state-icon">
                <i class="fa-solid fa-clock"></i>
            </div>
            <h2 class="empty-state-title">No processed files yet</h2>
            <p class="empty-state-description">
                Files are kept in your history. Deleted files are hidden but can be restored if needed.
            </p>
            <div class="empty-state-info">
                <p class="empty-state-info-text">
                    When you use our PDF tools, your processed files will appear here. You can download or delete them at any time.
                </p>
            </div>
        </div>
    @endif
</div>
@endsection

