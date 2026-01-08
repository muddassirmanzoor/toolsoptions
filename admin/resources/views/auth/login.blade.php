@extends('layouts.auth')

@section('title', 'Login - I Love PDF')

@section('hero-title', 'Sign In')

@section('breadcrumb')
    <a href="{{ route('login') }}" class="breadcrumb-link">Sign In</a>
@endsection

@section('content')
<div class="container">
    <div class="row g-4">
        <!-- Left Column - Login Form -->
        <div class="col-lg-6">
            <div class="auth-card login-card">
                <h3 class="auth-card-title">Login</h3>
                <form method="POST" action="{{ route('login') }}">
                    @csrf
                    <div class="form-group mb-3">
                        <label for="loginEmail" class="form-label">Email</label>
                        <input type="email" class="form-control @error('email') is-invalid @enderror" id="loginEmail" name="email" value="{{ old('email') }}" placeholder="Email" required>
                        @error('email')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="form-group mb-3">
                        <label for="loginPassword" class="form-label">Password</label>
                        <input type="password" class="form-control @error('password') is-invalid @enderror" id="loginPassword" name="password" placeholder="Password" required>
                        @error('password')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
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
                    <img src="{{ asset('modules/compressPDF/assets/star-white.svg') }}" alt="" class="star-icon">
                </div>
                <h3 class="auth-card-title">Create Your New Account</h3>
                <p class="card-description">If You Have Any Question Concerning Our Services Or Policy, Don't Hesitate To Contact Us.</p>
                <a href="{{ route('register') }}" class="btn-auth btn-create-account">Create Account</a>
            </div>
        </div>
    </div>
</div>
@endsection

