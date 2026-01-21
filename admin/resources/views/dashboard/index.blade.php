@extends('layouts.dashboard')

@section('title', 'My Account - I Love PDF')

@section('content')
<div class="dashboard-page">
    <h1 class="page-title">My Account</h1>

    <form method="POST" action="{{ route('dashboard.update') }}" id="accountForm">
        @csrf
        @method('PUT')

        <div class="account-grid">
            <div class="account-col-left">
                <!-- Personal / Business -->
                <div class="account-section">
                    <div class="section-header">
                        <div class="section-tabs">
                            <button class="tab-btn active" type="button" data-tab="personal">Personal</button>
                            <button class="tab-btn" type="button" data-tab="business">Business</button>
                        </div>
                        <a href="#" class="edit-link" id="editPersonalBtn">
                            <i class="fas fa-edit"></i> Edit
                        </a>
                    </div>

                    <div class="tab-content active" id="personalTab">
                        <div class="form-group">
                            <label class="form-label">First Name</label>
                            <input type="text" class="form-control" name="first_name" value="{{ $user->first_name ?? '' }}" id="firstName" readonly placeholder="First name">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Last Name</label>
                            <input type="text" class="form-control" name="last_name" value="{{ $user->last_name ?? '' }}" id="lastName" readonly placeholder="Last name">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Phone Number</label>
                            <input type="tel" class="form-control" name="phone_number" value="{{ $user->phone_number ?? '' }}" id="phoneNumber" disabled placeholder="Phone number">
                            <input type="hidden" id="country_code" name="country_code" value="{{ $user->country_code ?? '' }}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Country</label>
                            <select class="form-control" id="country" disabled></select>
                        </div>
                    </div>

                    <div class="tab-content" id="businessTab" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">Company Name</label>
                            <input type="text" class="form-control" name="company_name" value="{{ $user->company_name ?? '' }}" id="companyName" readonly placeholder="Company name">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Business Address</label>
                            <input type="text" class="form-control" name="business_address" value="{{ $user->business_address ?? '' }}" id="businessAddress" readonly placeholder="Business address">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tax ID</label>
                            <input type="text" class="form-control" name="tax_id" value="{{ $user->tax_id ?? '' }}" id="taxId" readonly placeholder="Tax ID">
                        </div>
                    </div>
                </div>

                <!-- Email -->
                <div class="account-section">
                    <div class="section-header">
                        <h3 class="section-title">Email</h3>
                        <a href="#" class="edit-link" id="editEmailBtn">
                            <i class="fas fa-edit"></i> Edit
                        </a>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-control" name="email" value="{{ $user->email }}" id="email" readonly placeholder="Email Address">
                    </div>
                </div>
            </div>

            <div class="account-col-right">
                <!-- Social Links -->
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
                            <a href="#" class="social-icon facebook" aria-label="Link Facebook">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="#" class="social-icon instagram" aria-label="Link Instagram">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="#" class="social-icon twitter" aria-label="Link Twitter">
                                <i class="fab fa-twitter"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
            <button type="submit" class="btn-save" id="saveBtn" style="display: none;">Save</button>
            <button type="button" class="btn-cancel" id="cancelBtn" style="display: none;">Cancel</button>
        </div>
    </form>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Phone input (intl-tel-input) with flag + separate dial code
    const phoneInput = document.querySelector("#phoneNumber");
    const countryCodeHidden = document.getElementById('country_code');
    const countrySelect = document.getElementById('country');

    function iso2FromDialCode(dialCodeWithPlus) {
        const dial = String(dialCodeWithPlus || '').replace('+', '').trim();
        if (!dial || !window.intlTelInputGlobals?.getCountryData) return null;
        const match = window.intlTelInputGlobals.getCountryData().find(c => String(c.dialCode) === dial);
        return match?.iso2 || null;
    }

    function setCountrySelectLabel(iso2) {
        if (!countrySelect || !window.intlTelInputGlobals?.getCountryData) return;
        const data = window.intlTelInputGlobals.getCountryData().find(c => c.iso2 === iso2);
        if (!data) return;
        countrySelect.value = data.iso2;
    }

    let iti = null;
    if (phoneInput && window.intlTelInput) {
        iti = window.intlTelInput(phoneInput, {
            initialCountry: "us",
            preferredCountries: ["us", "gb", "ca", "au"],
            separateDialCode: true,
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.3/build/js/utils.js"
        });

        const existingDialCode = @json($user->country_code ?? '');
        const iso2 = iso2FromDialCode(existingDialCode);
        if (iso2) iti.setCountry(iso2);

        // Populate country dropdown from intl-tel-input country list
        if (countrySelect && window.intlTelInputGlobals?.getCountryData) {
            const countries = [...window.intlTelInputGlobals.getCountryData()].sort((a, b) => a.name.localeCompare(b.name));
            countrySelect.innerHTML = '<option value="" disabled>Select country</option>';
            for (const c of countries) {
                const opt = document.createElement('option');
                opt.value = c.iso2;
                opt.textContent = c.name;
                countrySelect.appendChild(opt);
            }
            const initialIso2 = iti.getSelectedCountryData()?.iso2;
            if (initialIso2) {
                countrySelect.value = initialIso2;
            } else {
                countrySelect.selectedIndex = 0;
            }

            countrySelect.addEventListener('change', function () {
                const nextIso2 = this.value;
                if (nextIso2 && iti) {
                    iti.setCountry(nextIso2);
                }
            });
        }

        const syncDialCode = () => {
            if (!countryCodeHidden) return;
            const dialCode = iti.getSelectedCountryData()?.dialCode;
            countryCodeHidden.value = dialCode ? `+${dialCode}` : '';
            setCountrySelectLabel(iti.getSelectedCountryData()?.iso2);
        };

        syncDialCode();
        phoneInput.addEventListener('countrychange', syncDialCode);
    }

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
    const inputs = document.querySelectorAll('#personalTab input:not([type="hidden"]), #personalTab select, #businessTab input, #businessTab select, #email');

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
            if (input.tagName === 'SELECT') {
                input.disabled = true;
                return;
            }
            if (input.id === 'phoneNumber') {
                input.disabled = true;
                input.removeAttribute('readonly');
                return;
            }
            input.setAttribute('readonly', 'readonly');
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
        // Ensure country code is synced on submit
        if (iti && countryCodeHidden) {
            const dialCode = iti.getSelectedCountryData()?.dialCode;
            countryCodeHidden.value = dialCode ? `+${dialCode}` : '';
        }
    });

    // Start in non-editing mode (locks phone dropdown)
    disableEditing();

    // Also sync dial code right before submit (in case Save triggered by Enter key)
    const form = document.getElementById('accountForm');
    form?.addEventListener('submit', function () {
        if (iti && countryCodeHidden) {
            const dialCode = iti.getSelectedCountryData()?.dialCode;
            countryCodeHidden.value = dialCode ? `+${dialCode}` : '';
        }
    });
});
</script>
@endpush
@endsection

