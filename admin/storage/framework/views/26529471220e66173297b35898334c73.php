<?php $__env->startSection('title', 'Login - I Love PDF'); ?>

<?php $__env->startSection('hero-title', 'Sign In'); ?>

<?php $__env->startSection('breadcrumb'); ?>
    <a href="<?php echo e(route('login')); ?>" class="breadcrumb-link">Sign In</a>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<div class="container">
    <div class="row g-4">
        <!-- Left Column - Login Form -->
        <div class="col-lg-6">
            <div class="auth-card login-card">
                <h3 class="auth-card-title">Login</h3>
                <form method="POST" action="<?php echo e(route('login')); ?>">
                    <?php echo csrf_field(); ?>
                    <div class="form-group mb-3">
                        <label for="loginEmail" class="form-label">Email</label>
                        <input type="email" class="form-control <?php $__errorArgs = ['email'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>" id="loginEmail" name="email" value="<?php echo e(old('email')); ?>" placeholder="Email" required>
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
                        <label for="loginPassword" class="form-label">Password</label>
                        <input type="password" class="form-control <?php $__errorArgs = ['password'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>" id="loginPassword" name="password" placeholder="Password" required>
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
                    <button type="submit" class="btn-auth btn-login-submit">Login</button>
                    <div class="forgot-password mt-3">
                        <a href="#" class="forgot-link">Forget Your Password, Click Here...</a>
                    </div>
                    <div class="social-login mt-4">
                        <p class="social-text">Or login with:</p>
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
                </form>
            </div>
        </div>

        <!-- Right Column - Create Account Card (No form fields, just button) -->
        <div class="col-lg-6">
            <div class="auth-card create-account-card">
                <div class="card-star">
                    <img src="<?php echo e(asset('modules/compressPDF/assets/star-white.svg')); ?>" alt="" class="star-icon">
                </div>
                <h3 class="auth-card-title">Create Your New Account</h3>
                <p class="card-description">If You Have Any Question Concerning Our Services Or Policy, Don't Hesitate To Contact Us.</p>
                <a href="<?php echo e(route('register')); ?>" class="btn-auth btn-create-account">Create Account</a>
            </div>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>


<?php echo $__env->make('layouts.auth', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/dixwix-test/htdocs/test.dixwix.com/admin/resources/views/auth/login.blade.php ENDPATH**/ ?>