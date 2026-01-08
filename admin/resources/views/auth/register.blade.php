@extends('layouts.auth')

@section('title', 'Sign Up - I Love PDF')

@section('hero-title', 'Sign Up')

@section('breadcrumb')
    <a href="{{ route('register') }}" class="breadcrumb-link">Sign Up</a>
@endsection

@section('content')
<div class="container">
    <div class="row g-4">
        <!-- Left Column - Registration Form -->
        <div class="col-lg-6">
            <div class="auth-card login-card">
                <!-- <h3 class="auth-card-title">Create Your New Account</h3> -->
                <form method="POST" action="{{ route('register') }}" id="registerForm">
                    @csrf
                    <div class="form-group mb-3">
                        <label for="first_name" class="form-label">First Name</label>
                        <input type="text" class="form-control @error('first_name') is-invalid @enderror" id="first_name" name="first_name" value="{{ old('first_name') }}" placeholder="First Name" required>
                        @error('first_name')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="form-group mb-3">
                        <label for="last_name" class="form-label">Last Name</label>
                        <input type="text" class="form-control @error('last_name') is-invalid @enderror" id="last_name" name="last_name" value="{{ old('last_name') }}" placeholder="Last Name" required>
                        @error('last_name')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="form-group mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control @error('email') is-invalid @enderror" id="email" name="email" value="{{ old('email') }}" placeholder="Email" required>
                        @error('email')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="form-group mb-3">
                        <label for="phone_number" class="form-label">Phone Number</label>
                        <input type="tel" class="form-control @error('phone_number') is-invalid @enderror" id="phone_number" name="phone_number" value="{{ old('phone_number') }}" placeholder="Phone Number" required>
                        <input type="hidden" id="country_code" name="country_code" value="">
                        @error('phone_number')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="form-group mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control @error('password') is-invalid @enderror" id="password" name="password" placeholder="Password" required>
                        @error('password')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <button type="submit" class="btn-auth btn-create-account">Create Account</button>
                    <div class="text-center mt-3">
                        <p>Already have an account? <a href="{{ route('login') }}" class="forgot-link">Login</a></p>
                    </div>
                </form>
            </div>
        </div>

            <!-- Right Column - Login Card (No form fields, just informational) -->
            <div class="col-lg-6">
                <div class="auth-card create-account-card">
                    <div class="card-star">
                        <img src="{{ asset('modules/compressPDF/assets/star-white.svg') }}" alt="" class="star-icon">
                    </div>
                    <h3 class="auth-card-title">Already Have An Account?</h3>
                    <p class="card-description">If You Have Any Question Concerning Our Services Or Policy, Don't Hesitate To Contact Us.</p>
                    <a href="{{ route('login') }}" class="btn-auth btn-create-account">Login</a>
                </div>
            </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    // Initialize intl-tel-input
    const phoneInput = document.querySelector("#phone_number");
    const iti = window.intlTelInput(phoneInput, {
        initialCountry: "us",
        preferredCountries: ["us", "gb", "ca", "au"],
        separateDialCode: true,
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.3/build/js/utils.js"
    });

    // Update hidden country code field on form submit
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        const countryCode = iti.getSelectedCountryData().dialCode;
        document.getElementById('country_code').value = '+' + countryCode;
    });
</script>
@endsection

