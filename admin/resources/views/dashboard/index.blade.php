@extends('layouts.dashboard')

@section('title', 'My Account - I Love PDF')

@section('content')
<div class="dashboard-page">
    <h1 class="page-title">My Account</h1>

    <!-- Personal Information Section -->
    <div class="account-section">
        <div class="section-header">
            <div class="section-tabs">
                <button class="tab-btn active" data-tab="personal">Personal</button>
                <button class="tab-btn" data-tab="business">Business</button>
            </div>
            <a href="#" class="edit-link" id="editPersonalBtn">
                <i class="fas fa-edit"></i> Edit
            </a>
        </div>

        <div class="tab-content active" id="personalTab">
            <div class="form-group">
                <label class="form-label">First Name</label>
                <input type="text" class="form-control" value="{{ $user->first_name ?? '' }}" id="firstName" readonly>
            </div>
            <div class="form-group">
                <label class="form-label">Last Name</label>
                <input type="text" class="form-control" value="{{ $user->last_name ?? '' }}" id="lastName" readonly>
            </div>
            <div class="form-group">
                <label class="form-label">Phone Number</label>
                <div class="phone-input-wrapper">
                    <div class="country-code">
                        <span class="flag-icon">🇺🇸</span>
                        <span class="code-text">{{ $user->country_code ?? '+1' }}</span>
                    </div>
                    <input type="text" class="form-control phone-input" value="{{ $user->phone_number ?? '' }}" id="phoneNumber" readonly>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Country</label>
                <select class="form-control" id="country" disabled>
                    <option value="Pakistan" {{ ($user->country_code ?? '') == '+92' ? 'selected' : '' }}>Pakistan</option>
                    <option value="United States" {{ ($user->country_code ?? '') == '+1' ? 'selected' : '' }}>United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                </select>
            </div>
        </div>

        <div class="tab-content" id="businessTab" style="display: none;">
            <div class="form-group">
                <label class="form-label">Company Name</label>
                <input type="text" class="form-control" value="" readonly>
            </div>
            <div class="form-group">
                <label class="form-label">Business Address</label>
                <input type="text" class="form-control" value="" readonly>
            </div>
            <div class="form-group">
                <label class="form-label">Tax ID</label>
                <input type="text" class="form-control" value="" readonly>
            </div>
        </div>
    </div>

    <!-- Social Links Section -->
    <div class="account-section">
        <h3 class="section-title">Social links</h3>
        <p class="section-description">Connect your social accounts to log in through Facebook or Google.</p>
        <div class="social-email">
            <i class="fas fa-envelope"></i>
            <span>{{ $user->email }}</span>
        </div>
        <div class="social-links-section">
            <h4 class="social-links-title">Link more social network accounts</h4>
            <div class="social-icons">
                <a href="#" class="social-icon facebook">
                    <i class="fab fa-facebook-f"></i>
                </a>
                <a href="#" class="social-icon instagram">
                    <i class="fab fa-instagram"></i>
                </a>
                <a href="#" class="social-icon twitter">
                    <i class="fab fa-twitter"></i>
                </a>
            </div>
        </div>
    </div>

    <!-- Email Section -->
    <div class="account-section">
        <div class="section-header">
            <h3 class="section-title">Email</h3>
            <a href="#" class="edit-link" id="editEmailBtn">
                <i class="fas fa-edit"></i> Edit
            </a>
        </div>
        <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" value="{{ $user->email }}" id="email" readonly>
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
        <button type="button" class="btn-save" id="saveBtn" style="display: none;">Save</button>
        <button type="button" class="btn-cancel" id="cancelBtn" style="display: none;">Cancel</button>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            
            this.classList.add('active');
            document.getElementById(targetTab + 'Tab').classList.add('active');
            document.getElementById(targetTab + 'Tab').style.display = 'block';
        });
    });

    // Edit functionality
    let isEditing = false;
    const editPersonalBtn = document.getElementById('editPersonalBtn');
    const editEmailBtn = document.getElementById('editEmailBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const inputs = document.querySelectorAll('#personalTab input, #personalTab select, #email');

    function enableEditing() {
        isEditing = true;
        inputs.forEach(input => {
            input.removeAttribute('readonly');
            input.disabled = false;
        });
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
    }

    function disableEditing() {
        isEditing = false;
        inputs.forEach(input => {
            input.setAttribute('readonly', 'readonly');
            if (input.tagName === 'SELECT') {
                input.disabled = true;
            }
        });
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    }

    editPersonalBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        enableEditing();
    });

    editEmailBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        enableEditing();
    });

    cancelBtn?.addEventListener('click', function() {
        disableEditing();
        // Reload page to reset values
        location.reload();
    });

    saveBtn?.addEventListener('click', function() {
        // Here you would typically send an AJAX request to update the user data
        alert('Save functionality will be implemented with backend API');
        disableEditing();
    });
});
</script>
@endpush
@endsection

