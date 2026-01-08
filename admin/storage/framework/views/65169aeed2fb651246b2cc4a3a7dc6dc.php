<?php $__env->startSection('title', 'Sign Up - I Love PDF'); ?>

<?php $__env->startSection('body-class', 'auth-register-page'); ?>

<?php $__env->startSection('hero-title', 'Sign Up'); ?>

<?php $__env->startSection('breadcrumb'); ?>
    <a href="<?php echo e(route('register')); ?>" class="breadcrumb-link">Sign Up</a>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<div class="container">
    <div class="row g-4">
        <!-- Left Column - Registration Form -->
        <div class="col-lg-6">
            <div class="auth-card login-card">
                <!-- <h3 class="auth-card-title">Create Your New Account</h3> -->
                <form method="POST" action="<?php echo e(route('register')); ?>" id="registerForm">
                    <?php echo csrf_field(); ?>
                    <div class="form-group mb-3">
                        <label for="first_name" class="form-label">First Name</label>
                        <input type="text" class="form-control <?php $__errorArgs = ['first_name'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>" id="first_name" name="first_name" value="<?php echo e(old('first_name')); ?>" placeholder="First Name" required>
                        <?php $__errorArgs = ['first_name'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                            <div class="invalid-feedback"><?php echo e($message); ?></div>
                        <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div class="form-group mb-3">
                        <label for="last_name" class="form-label">Last Name</label>
                        <input type="text" class="form-control <?php $__errorArgs = ['last_name'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>" id="last_name" name="last_name" value="<?php echo e(old('last_name')); ?>" placeholder="Last Name" required>
                        <?php $__errorArgs = ['last_name'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                            <div class="invalid-feedback"><?php echo e($message); ?></div>
                        <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div class="form-group mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control <?php $__errorArgs = ['email'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>" id="email" name="email" value="<?php echo e(old('email')); ?>" placeholder="Email" required>
                        <?php $__errorArgs = ['email'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                            <div class="invalid-feedback"><?php echo e($message); ?></div>
                        <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div class="form-group mb-3">
                        <label for="phone_number" class="form-label">Phone Number</label>
                        <input type="tel" class="form-control <?php $__errorArgs = ['phone_number'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>" id="phone_number" name="phone_number" value="<?php echo e(old('phone_number')); ?>" placeholder="Phone Number" required>
                        <input type="hidden" id="country_code" name="country_code" value="">
                        <?php $__errorArgs = ['phone_number'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                            <div class="invalid-feedback"><?php echo e($message); ?></div>
                        <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div class="form-group mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control <?php $__errorArgs = ['password'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>" id="password" name="password" placeholder="Password" required>
                        <small id="passwordStrengthText" class="form-text mt-1"></small>
                        <?php $__errorArgs = ['password'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                            <div class="invalid-feedback"><?php echo e($message); ?></div>
                        <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <button type="submit" class="btn-auth btn-create-account">Create Account</button>
                    <div class="text-center mt-3">
                        <p>Already have an account? <a href="<?php echo e(route('login')); ?>" class="forgot-link">Login</a></p>
                    </div>
                </form>
            </div>
        </div>

            <!-- Right Column - Login Card (No form fields, just informational) -->
            <div class="col-lg-6">
                <div class="auth-card create-account-card">
                    <div class="card-star">
                        <img src="<?php echo e(asset('modules/compressPDF/assets/star-white.svg')); ?>" alt="" class="star-icon">
                    </div>
                    <h3 class="auth-card-title">Already Have An Account?</h3>
                    <p class="card-description">If You Have Any Question Concerning Our Services Or Policy, Don't Hesitate To Contact Us.</p>
                    <a href="<?php echo e(route('login')); ?>" class="btn-auth btn-create-account">Login</a>
                </div>
            </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
<script>
    // Initialize intl-tel-input
    const phoneInput = document.querySelector("#phone_number");
    const iti = window.intlTelInput(phoneInput, {
        initialCountry: "us",
        preferredCountries: ["us", "gb", "ca", "au"],
        separateDialCode: true,
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.3/build/js/utils.js"
    });

    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const passwordStrengthText = document.getElementById('passwordStrengthText');
    const MIN_PASSWORD_LENGTH = 8;

    function evaluatePasswordStrength(password) {
        if (!password) {
            return { level: '', message: '' };
        }

        let score = 0;

        if (password.length >= MIN_PASSWORD_LENGTH) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) {
            return { level: 'weak', message: 'Password strength: Weak. Use at least ' + MIN_PASSWORD_LENGTH + ' characters with upper, lower, number & symbol.' };
        } else if (score === 3 || score === 4) {
            return { level: 'medium', message: 'Password strength: Medium. Add more variety (upper, lower, numbers & symbols) for better security.' };
        } else {
            return { level: 'strong', message: 'Password strength: Strong.' };
        }
    }

    passwordInput.addEventListener('input', function () {
        const value = passwordInput.value;
        const result = evaluatePasswordStrength(value);

        passwordStrengthText.textContent = result.message;
        passwordStrengthText.classList.remove('text-danger', 'text-warning', 'text-success');

        if (result.level === 'weak') {
            passwordStrengthText.classList.add('text-danger');
        } else if (result.level === 'medium') {
            passwordStrengthText.classList.add('text-warning');
        } else if (result.level === 'strong') {
            passwordStrengthText.classList.add('text-success');
        }
    });

    // Update hidden country code field and validate password on submit
    registerForm.addEventListener('submit', function(e) {
        const countryCode = iti.getSelectedCountryData().dialCode;
        document.getElementById('country_code').value = '+' + countryCode;

        const passwordValue = passwordInput.value || '';

        if (passwordValue.length < MIN_PASSWORD_LENGTH) {
            e.preventDefault();
            passwordInput.classList.add('is-invalid');
            passwordStrengthText.textContent = 'Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters long.';
            passwordStrengthText.classList.remove('text-warning', 'text-success');
            passwordStrengthText.classList.add('text-danger');
            return false;
        }

        passwordInput.classList.remove('is-invalid');
        return true;
    });
</script>
<?php $__env->stopSection(); ?>


<?php echo $__env->make('layouts.auth', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/dixwix-test/htdocs/test.dixwix.com/admin/resources/views/auth/register.blade.php ENDPATH**/ ?>