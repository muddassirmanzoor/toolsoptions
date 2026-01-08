<?php $__env->startSection('title', 'My Account - I Love PDF'); ?>

<?php $__env->startSection('content'); ?>
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
                <input type="text" class="form-control" value="<?php echo e($user->first_name ?? ''); ?>" id="firstName" readonly>
            </div>
            <div class="form-group">
                <label class="form-label">Last Name</label>
                <input type="text" class="form-control" value="<?php echo e($user->last_name ?? ''); ?>" id="lastName" readonly>
            </div>
            <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" class="form-control" id="dashboardPhone" value="<?php echo e($user->phone_number ?? ''); ?>" placeholder="Phone Number" readonly data-country-code="<?php echo e($user->country_code ?? ''); ?>">
                <input type="hidden" id="dashboardCountryCode" value="<?php echo e($user->country_code ?? ''); ?>">
            </div>
            <div class="form-group">
                <label class="form-label">Country</label>
                <select class="form-control" id="country" disabled>
                    <option value="Pakistan" <?php echo e(($user->country_code ?? '') == '+92' ? 'selected' : ''); ?>>Pakistan</option>
                    <option value="United States" <?php echo e(($user->country_code ?? '') == '+1' ? 'selected' : ''); ?>>United States</option>
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
            <span><?php echo e($user->email); ?></span>
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
            <input type="email" class="form-control" value="<?php echo e($user->email); ?>" id="email" readonly>
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
        <button type="button" class="btn-save" id="saveBtn" style="display: none;">Save</button>
        <button type="button" class="btn-cancel" id="cancelBtn" style="display: none;">Cancel</button>
    </div>
</div>

<?php $__env->startPush('scripts'); ?>
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

    // Initialize intl-tel-input for dashboard phone field (same behavior as register page)
    const dashboardPhoneInput = document.getElementById('dashboardPhone');
    const dashboardCountryCode = document.getElementById('dashboardCountryCode');

    if (dashboardPhoneInput && window.intlTelInput) {
        const storedCode = (dashboardPhoneInput.dataset.countryCode || '').trim();
        const dialCode = storedCode.startsWith('+') ? storedCode.substring(1) : storedCode;
        const dialToIso = {
            '1': 'us',
            '44': 'gb',
            '92': 'pk',
            '61': 'au',
            '971': 'ae',
        };

        const initialIso = dialToIso[dialCode] || 'us';

        const itiDashboard = window.intlTelInput(dashboardPhoneInput, {
            initialCountry: initialIso,
            separateDialCode: true,
            preferredCountries: ['us', 'gb', 'ca', 'au', 'pk'],
        });

        // Keep hidden country code in sync when user changes country (for future save flow)
        dashboardPhoneInput.addEventListener('countrychange', function () {
            const countryData = itiDashboard.getSelectedCountryData();
            if (dashboardCountryCode) {
                dashboardCountryCode.value = '+' + countryData.dialCode;
            }
        });

        // Ensure hidden code is set on load as well
        const initialCountryData = itiDashboard.getSelectedCountryData();
        if (dashboardCountryCode && initialCountryData && !dashboardCountryCode.value) {
            dashboardCountryCode.value = '+' + initialCountryData.dialCode;
        }
    }
});
</script>
<?php $__env->stopPush(); ?>
<?php $__env->stopSection(); ?>


<?php echo $__env->make('layouts.dashboard', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/dixwix-test/htdocs/test.dixwix.com/admin/resources/views/dashboard/index.blade.php ENDPATH**/ ?>