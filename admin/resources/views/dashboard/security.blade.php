@extends('layouts.dashboard')

@section('title', 'Security - I Love PDF')

@section('content')
<div class="dashboard-page">
    <h1 class="page-title">Security</h1>

    <form method="POST" action="{{ route('dashboard.security.update') }}">
        @csrf
        @method('PUT')

        <div class="account-grid {{ !empty($showTwoFactor) ? 'account-grid--equal' : 'security-grid--single' }}">
            <!-- Left: Password -->
            <div class="account-section">
                <div class="security-card-header">
                    <h3 class="security-card-title">Password</h3>
                </div>

                <div class="form-group">
                    <label class="form-label" for="newPassword">New Password</label>
                    <input id="newPassword" type="password" class="form-control" name="new_password" placeholder="New Password" autocomplete="new-password">
                </div>

                <div class="password-strength" id="passwordStrength" aria-live="polite">
                    <div class="password-strength-bar">
                        <div class="password-strength-bar-fill" id="passwordStrengthFill" style="width:0%"></div>
                    </div>
                    <div class="password-strength-meta">
                        <span class="password-strength-label">Strength:</span>
                        <span class="password-strength-value" id="passwordStrengthValue">—</span>
                    </div>
                    <ul class="password-criteria" id="passwordCriteria">
                        <li data-rule="length">At least 8 characters</li>
                        <li data-rule="upper">At least 1 uppercase letter</li>
                        <li data-rule="number">At least 1 number</li>
                        <li data-rule="special">At least 1 special character</li>
                    </ul>
                </div>

                <div class="form-group">
                    <label class="form-label" for="newPasswordConfirmation">Repeat New Password</label>
                    <input id="newPasswordConfirmation" type="password" class="form-control" name="new_password_confirmation" placeholder="Repeat New Password" autocomplete="new-password">
                </div>

                <div class="form-group">
                    <label class="form-label" for="currentPassword">Current Password</label>
                    <div class="password-input-wrapper">
                        <input id="currentPassword" type="password" class="form-control" name="current_password" placeholder="Current Password" autocomplete="current-password">
                        <button type="button" class="password-toggle-btn" id="currentPasswordToggle" aria-label="Toggle password visibility">
                            <i class="fas fa-eye" id="currentPasswordToggleIcon"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right: Two factor authentication -->
            @if(!empty($showTwoFactor))
            <div class="account-section">
                <div class="security-card-header security-card-header--between">
                    <h3 class="security-card-title">Two factor authentication</h3>
                    <span class="security-status {{ $twoFactorEnabled ? 'enabled' : 'disabled' }}">
                        {{ $twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                    </span>
                </div>

                <p class="section-description" style="margin-bottom: 18px;">
                    Two Factor Authentication improves your account security.
                </p>

                <div class="form-group" style="margin-bottom: 18px;">
                    <label class="form-label" for="twoFactorPassword">Password</label>
                    <input id="twoFactorPassword" type="password" class="form-control" name="two_factor_password" placeholder="Password" autocomplete="current-password">
                </div>

                <div class="twofa-row">
                    <div class="twofa-qr" aria-hidden="true">
                        <!-- Placeholder QR (replace when backend 2FA is added) -->
                        <div class="twofa-qr-placeholder"></div>
                    </div>
                    <div class="twofa-help">
                        <p class="twofa-text">
                            Download Google Authenticator on the <strong>App Store</strong> or <strong>Google Play</strong>,
                            scan the QR image and insert the generated code
                        </p>
                    </div>
                </div>

                <div class="form-group" style="margin-top: 18px;">
                    <label class="form-label" for="authCode">Google Authenticator Code</label>
                    <input id="authCode" type="text" class="form-control" name="authenticator_code" placeholder="Code" inputmode="numeric" autocomplete="one-time-code">
                </div>
            </div>
            @endif
        </div>

        <div class="action-buttons">
            <button type="submit" class="btn-save">Save</button>
            <a href="{{ route('dashboard.security') }}" class="btn-cancel" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;">Cancel</a>
        </div>
    </form>
</div>

@push('scripts')
<script>
(() => {
    const input = document.getElementById('newPassword');
    const box = document.getElementById('passwordStrength');
    const fill = document.getElementById('passwordStrengthFill');
    const value = document.getElementById('passwordStrengthValue');
    const criteria = document.getElementById('passwordCriteria');

    if (!input || !box || !fill || !value || !criteria) return;

    const rules = {
        length: (s) => (s || '').length >= 8,
        upper:  (s) => /[A-Z]/.test(s || ''),
        number: (s) => /[0-9]/.test(s || ''),
        special:(s) => /[^A-Za-z0-9]/.test(s || ''),
    };

    const strengthForScore = (score) => {
        // score 0..4
        if (score <= 1) return { label: 'Weak', color: '#ef4444' };
        if (score === 2) return { label: 'Fair', color: '#f59e0b' };
        if (score === 3) return { label: 'Good', color: '#22c55e' };
        return { label: 'Strong', color: '#16a34a' };
    };

    const setItem = (key, ok) => {
        const li = criteria.querySelector(`li[data-rule="${key}"]`);
        if (!li) return;
        li.classList.toggle('ok', ok);
    };

    const update = () => {
        const pwd = input.value || '';
        const results = Object.fromEntries(Object.keys(rules).map(k => [k, rules[k](pwd)]));
        const score = Object.values(results).filter(Boolean).length;

        for (const [k, ok] of Object.entries(results)) setItem(k, ok);

        if (!pwd) {
            fill.style.width = '0%';
            fill.style.backgroundColor = 'transparent';
            value.textContent = '—';
            return;
        }

        const pct = Math.round((score / 4) * 100);
        const s = strengthForScore(score);
        fill.style.width = `${pct}%`;
        fill.style.backgroundColor = s.color;
        value.textContent = s.label;
    };

    input.addEventListener('input', update);
    update();
})();

// Password visibility toggle for current password
(() => {
    const currentPasswordInput = document.getElementById('currentPassword');
    const currentPasswordToggle = document.getElementById('currentPasswordToggle');
    const currentPasswordToggleIcon = document.getElementById('currentPasswordToggleIcon');

    if (currentPasswordToggle && currentPasswordInput) {
        currentPasswordToggle.addEventListener('click', function() {
            const type = currentPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            currentPasswordInput.setAttribute('type', type);
            
            // Toggle icon
            if (type === 'text') {
                currentPasswordToggleIcon.classList.remove('fa-eye');
                currentPasswordToggleIcon.classList.add('fa-eye-slash');
            } else {
                currentPasswordToggleIcon.classList.remove('fa-eye-slash');
                currentPasswordToggleIcon.classList.add('fa-eye');
            }
        });
    }
})();
</script>
@endpush
@endsection

