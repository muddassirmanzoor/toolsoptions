@extends('layouts.dashboard')

@section('title', 'Team - I Love PDF')

@section('content')
<div class="dashboard-page team-page">
    <h1 class="page-title">Workspace</h1>

    <div class="workspace-content">
        <div class="workspace-left">
            <!-- Workspace Description -->
            <div class="workspace-description">
                <div class="description-item">
                    <i class="fas fa-check-circle check-icon"></i>
                    <p>Obtain and manage multiple iLovePDF licenses, inviting several users to your workspace.</p>
                </div>
                <div class="description-item">
                    <i class="fas fa-check-circle check-icon"></i>
                    <p>Organize your workspace into various teams.</p>
                </div>
                <div class="description-item">
                    <i class="fas fa-check-circle check-icon"></i>
                    <p>Set permission roles and assign each member to their team in your workspace.</p>
                </div>
            </div>

            <!-- Workspace Illustration Area -->
            <div class="workspace-illustration">
                <div class="illustration-container">
                    <img src="{{ asset('images/workspace 1.png') }}" alt="Workspace Team Collaboration" class="workspace-illustration-img">
                </div>
            </div>
        </div>

        <!-- Invite Section -->
        <div class="workspace-right">
            <div class="invite-section">
                <h3 class="invite-title">Invite</h3>
                <div class="invite-form">
                    <div class="email-input-group" id="emailInputs">
                        <div class="email-input-wrapper">
                            <input type="email" class="form-control email-input" placeholder="john@gmail.com" name="emails[]">
                            <button type="button" class="btn-add-email" id="addEmailBtn" title="Add another member">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="btn-invite" id="inviteMembersBtn">Invite</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
        <button type="button" class="btn-save" id="saveWorkspaceBtn">Save</button>
        <button type="button" class="btn-cancel" id="cancelWorkspaceBtn">Cancel</button>
    </div>
</div>

<!-- Invite Members Modal -->
<div class="modal fade" id="inviteMembersModal" tabindex="-1" aria-labelledby="inviteMembersModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content invite-modal-content">
            <div class="modal-header invite-modal-header">
                <h2 class="modal-title invite-modal-title" id="inviteMembersModalLabel">Invite Members</h2>
                <button type="button" class="btn-close-modal" data-bs-dismiss="modal" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body invite-modal-body">
                <p class="invite-modal-description">Invite team members to your workspace. Enter their email addresses below to send invitations.</p>
                
                <div class="invite-form-modal" id="inviteFormModal">
                    <label class="form-label-modal">Email Addresses</label>
                    <div class="email-input-group-modal" id="emailInputsModal">
                        <div class="email-input-wrapper-modal">
                            <input type="email" class="form-control email-input-modal" placeholder="john@gmail.com" name="invite_emails[]" required>
                            <button type="button" class="btn-add-email-modal" id="addEmailModalBtn" title="Add another member">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer invite-modal-footer">
                <button type="button" class="btn-invite-modal" id="inviteSubmitBtn">Invite</button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Add email input functionality
    function addEmailInput(container, isModal = false) {
        const wrapper = document.createElement('div');
        wrapper.className = isModal ? 'email-input-wrapper-modal' : 'email-input-wrapper';
        
        const input = document.createElement('input');
        input.type = 'email';
        input.className = isModal ? 'form-control email-input-modal' : 'form-control email-input';
        input.placeholder = 'john@gmail.com';
        input.name = isModal ? 'invite_emails[]' : 'emails[]';
        if (isModal) input.required = true;
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = isModal ? 'btn-remove-email-modal' : 'btn-remove-email';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Remove';
        removeBtn.addEventListener('click', function() {
            wrapper.remove();
        });
        
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = isModal ? 'btn-add-email-modal' : 'btn-add-email';
        addBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addBtn.title = 'Add another member';
        addBtn.addEventListener('click', function() {
            addEmailInput(container, isModal);
        });
        
        wrapper.appendChild(input);
        wrapper.appendChild(removeBtn);
        wrapper.appendChild(addBtn);
        container.appendChild(wrapper);
    }

    // Main page add email button
    const addEmailBtn = document.getElementById('addEmailBtn');
    const emailInputs = document.getElementById('emailInputs');
    if (addEmailBtn && emailInputs) {
        addEmailBtn.addEventListener('click', function() {
            addEmailInput(emailInputs, false);
        });
    }

    // Modal add email button
    const addEmailModalBtn = document.getElementById('addEmailModalBtn');
    const emailInputsModal = document.getElementById('emailInputsModal');
    if (addEmailModalBtn && emailInputsModal) {
        addEmailModalBtn.addEventListener('click', function() {
            addEmailInput(emailInputsModal, true);
        });
    }

    // Open invite members modal
    const inviteMembersBtn = document.getElementById('inviteMembersBtn');
    const inviteMembersModal = new bootstrap.Modal(document.getElementById('inviteMembersModal'));
    
    if (inviteMembersBtn) {
        inviteMembersBtn.addEventListener('click', function() {
            // Clear previous inputs in modal
            const modalInputs = document.getElementById('emailInputsModal');
            if (modalInputs) {
                modalInputs.innerHTML = '';
                addEmailInput(modalInputs, true);
            }
            inviteMembersModal.show();
        });
    }

    // Submit invite
    const inviteSubmitBtn = document.getElementById('inviteSubmitBtn');
    if (inviteSubmitBtn) {
        inviteSubmitBtn.addEventListener('click', function() {
            const emailInputs = document.querySelectorAll('#emailInputsModal .email-input-modal');
            const emails = Array.from(emailInputs)
                .map(input => input.value.trim())
                .filter(email => email !== '');

            if (emails.length === 0) {
                alert('Please enter at least one email address.');
                return;
            }

            // Validate emails
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = emails.filter(email => !emailRegex.test(email));
            
            if (invalidEmails.length > 0) {
                alert('Please enter valid email addresses.');
                return;
            }

            // Here you would typically send an AJAX request to invite members
            console.log('Inviting members:', emails);
            
            // Show success message and close modal
            alert('Invitations sent successfully!');
            inviteMembersModal.hide();
        });
    }

    // Save workspace button
    const saveWorkspaceBtn = document.getElementById('saveWorkspaceBtn');
    if (saveWorkspaceBtn) {
        saveWorkspaceBtn.addEventListener('click', function() {
            // Here you would typically save workspace settings
            console.log('Saving workspace...');
            alert('Workspace saved successfully!');
        });
    }

    // Cancel workspace button
    const cancelWorkspaceBtn = document.getElementById('cancelWorkspaceBtn');
    if (cancelWorkspaceBtn) {
        cancelWorkspaceBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                // Reset form or redirect
                location.reload();
            }
        });
    }
});
</script>
@endpush
