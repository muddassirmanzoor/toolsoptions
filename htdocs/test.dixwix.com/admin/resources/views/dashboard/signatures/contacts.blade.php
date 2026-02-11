@extends('layouts.dashboard')

@section('title', 'Signature contacts - I Love PDF')

@section('content')
<div class="dashboard-page dashboard-signatures-page">
    <div class="signatures-page-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div class="d-flex align-items-center gap-2">
            <i class="fas fa-address-book text-primary me-2" style="font-size: 1.5rem;"></i>
            <h1 class="page-title mb-0">Contacts</h1>
        </div>
        <button type="button" class="btn btn-new-signature" data-bs-toggle="modal" data-bs-target="#addContactModal">
            Add contact
        </button>
    </div>

    <div class="signatures-section">
        <h2 class="signatures-section-title mb-3">Your contacts</h2>
        <p class="text-muted small mb-3">Save people you often send signature requests to. You can reuse them when creating new requests.</p>

        {{-- Add contact modal --}}
        <div class="modal fade" id="addContactModal" tabindex="-1" aria-labelledby="addContactModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <form action="{{ route('signatures.contacts.store') }}" method="POST">
                        @csrf
                        <div class="modal-header">
                            <h5 class="modal-title" id="addContactModalLabel">Add contact</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="add_name" class="form-label" style="color: #212529; font-weight: 500;">Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control @error('name') is-invalid @enderror" id="add_name" name="name" value="{{ old('name') }}" placeholder="Enter name" required maxlength="255">
                                @error('name')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="mb-3">
                                <label for="add_email" class="form-label" style="color: #212529; font-weight: 500;">Email <span class="text-danger">*</span></label>
                                <input type="email" class="form-control @error('email') is-invalid @enderror" id="add_email" name="email" value="{{ old('email') }}" placeholder="Enter email address" required maxlength="255">
                                @error('email')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="mb-3">
                                <label for="add_phone" class="form-label" style="color: #212529; font-weight: 500;">Phone</label>
                                <input type="text" class="form-control @error('phone') is-invalid @enderror" id="add_phone" name="phone" value="{{ old('phone') }}" placeholder="Enter phone number" maxlength="50">
                                @error('phone')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="mb-0">
                                <label for="add_company" class="form-label" style="color: #212529; font-weight: 500;">Company</label>
                                <input type="text" class="form-control @error('company') is-invalid @enderror" id="add_company" name="company" value="{{ old('company') }}" placeholder="Enter company (optional)" maxlength="255">
                                @error('company')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Add contact</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        @if($contacts->count() > 0)
            <div class="tasks-card signatures-requests-card">
                <div class="table-responsive">
                    <table class="table tasks-table signatures-requests-table align-middle mb-0">
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Email</th>
                                <th scope="col">Phone</th>
                                <th scope="col">Company</th>
                                <th scope="col" class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($contacts as $contact)
                                <tr>
                                    <td><span class="signature-doc-name">{{ $contact->name }}</span></td>
                                    <td><a href="mailto:{{ $contact->email }}" class="text-decoration-none">{{ $contact->email }}</a></td>
                                    <td><span class="text-muted">{{ $contact->phone ?? '—' }}</span></td>
                                    <td><span class="text-muted">{{ $contact->company ?? '—' }}</span></td>
                                    <td class="text-end">
                                        <button type="button" class="btn btn-sm btn-outline-secondary me-1" data-bs-toggle="modal" data-bs-target="#editContactModal{{ $contact->id }}" title="Edit">
                                            <i class="fas fa-pen"></i>
                                        </button>
                                        <form action="{{ route('signatures.contacts.destroy', $contact) }}" method="POST" class="d-inline" onsubmit="return confirm('Remove this contact?');">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="btn btn-sm btn-outline-danger" title="Remove">
                                                <i class="fas fa-trash-alt"></i>
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                                {{-- Edit modal per contact --}}
                                <div class="modal fade" id="editContactModal{{ $contact->id }}" tabindex="-1" aria-labelledby="editContactModalLabel{{ $contact->id }}" aria-hidden="true">
                                    <div class="modal-dialog modal-dialog-centered">
                                        <div class="modal-content">
                                            <form action="{{ route('signatures.contacts.update', $contact) }}" method="POST">
                                                @csrf
                                                @method('PUT')
                                                <div class="modal-header">
                                                    <h5 class="modal-title" id="editContactModalLabel{{ $contact->id }}">Edit contact</h5>
                                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                </div>
                                                <div class="modal-body">
                                                    <div class="mb-3">
                                                        <label for="edit_name_{{ $contact->id }}" class="form-label" style="color: #212529; font-weight: 500;">Name <span class="text-danger">*</span></label>
                                                        <input type="text" class="form-control" id="edit_name_{{ $contact->id }}" name="name" value="{{ old('name', $contact->name) }}" placeholder="Enter name" required maxlength="255">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label for="edit_email_{{ $contact->id }}" class="form-label" style="color: #212529; font-weight: 500;">Email <span class="text-danger">*</span></label>
                                                        <input type="email" class="form-control" id="edit_email_{{ $contact->id }}" name="email" value="{{ old('email', $contact->email) }}" placeholder="Enter email address" required maxlength="255">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label for="edit_phone_{{ $contact->id }}" class="form-label" style="color: #212529; font-weight: 500;">Phone</label>
                                                        <input type="text" class="form-control" id="edit_phone_{{ $contact->id }}" name="phone" value="{{ old('phone', $contact->phone) }}" placeholder="Enter phone number" maxlength="50">
                                                    </div>
                                                    <div class="mb-0">
                                                        <label for="edit_company_{{ $contact->id }}" class="form-label" style="color: #212529; font-weight: 500;">Company</label>
                                                        <input type="text" class="form-control" id="edit_company_{{ $contact->id }}" name="company" value="{{ old('company', $contact->company) }}" placeholder="Enter company (optional)" maxlength="255">
                                                    </div>
                                                </div>
                                                <div class="modal-footer">
                                                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                                                    <button type="submit" class="btn btn-primary">Save changes</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                @if($contacts->hasPages())
                    <div class="d-flex justify-content-center mt-3">
                        {{ $contacts->links() }}
                    </div>
                @endif
            </div>
        @else
            <div class="tasks-card signatures-empty-card text-center py-5">
                <div class="signatures-empty-pdf-icon mb-3">
                    <i class="fas fa-address-book text-muted" style="font-size: 3rem;"></i>
                </div>
                <p class="signatures-empty-message mb-2">You have no contacts yet</p>
                <p class="text-muted small mb-3">Add contacts to quickly select them when sending signature requests.</p>
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addContactModal">
                    Add your first contact
                </button>
            </div>
        @endif
    </div>
</div>
@endsection
