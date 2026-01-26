@extends('layouts.dashboard')

@section('title', 'Upgrade to Premium - I Love PDF')

@section('content')
<div class="dashboard-page premium-page">
    <div class="premium-container">
        <div class="row g-0">
            <!-- Left Section - Main Content -->
            <div class="col-lg-7 premium-left">
                <div class="premium-content">
                    <div class="premium-logo">
                        <h1 class="logo-text">I❤️PDF</h1>
                    </div>
                    
                    <h2 class="premium-heading">Upgrade to Premium</h2>

                    <!-- Pricing Plans -->
                    <div class="pricing-plans">
                        <div class="pricing-plan active" data-plan="monthly">
                            <div class="plan-label">Monthly</div>
                            <div class="plan-price">$7</div>
                        </div>
                        <div class="pricing-plan" data-plan="yearly">
                            <div class="plan-label">Yearly</div>
                            <div class="plan-price">$48</div>
                            <div class="plan-savings">$4 / month</div>
                            <span class="discount-badge">-42%</span>
                        </div>
                    </div>

                    <!-- Payment Methods -->
                    <div class="payment-methods-premium">
                        <div class="payment-method-item" data-method="card">
                            <svg class="payment-card-icon" width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="48" height="32" rx="4" fill="#E3F2FD"/>
                                <rect x="4" y="8" width="8" height="6" rx="1" fill="#FFC107"/>
                                <rect x="4" y="18" width="20" height="2" rx="1" fill="#90CAF9"/>
                                <rect x="4" y="22" width="16" height="2" rx="1" fill="#90CAF9"/>
                                <circle cx="38" cy="22" r="3" fill="#F44336"/>
                                <ellipse cx="42" cy="22" rx="2" ry="3" fill="#FFC107"/>
                            </svg>
                        </div>
                        <div class="payment-method-item paypal-tab active" data-method="paypal">
                            <div class="paypal-content-wrapper">
                                <svg class="paypal-logo-icon" width="24" height="24" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M30.5 15.5c-1.2-7.8-7.1-13.5-14.8-13.5H5.5c-0.8 0-1.5 0.6-1.6 1.4L0 45.5c-0.1 0.7 0.5 1.3 1.2 1.3h8.5l2.1-13.3c0.1-0.8 0.8-1.4 1.6-1.4h3.2c6.5 0 11.8-5.3 12.9-11.8 0.6-3.2 0-5.8-1.6-7.6z" fill="#003087"/>
                                    <path d="M30.5 15.5c-1.2-7.8-7.1-13.5-14.8-13.5H5.5c-0.8 0-1.5 0.6-1.6 1.4L0 45.5c-0.1 0.7 0.5 1.3 1.2 1.3h8.5l2.1-13.3c0.1-0.8 0.8-1.4 1.6-1.4h3.2c6.5 0 11.8-5.3 12.9-11.8 0.6-3.2 0-5.8-1.6-7.6z" fill="#009CDE"/>
                                    <path d="M50 15.5c-1.2-7.8-7.1-13.5-14.8-13.5H25c-0.8 0-1.5 0.6-1.6 1.4L19.5 45.5c-0.1 0.7 0.5 1.3 1.2 1.3h8.5l2.1-13.3c0.1-0.8 0.8-1.4 1.6-1.4h3.2c6.5 0 11.8-5.3 12.9-11.8 0.6-3.2 0-5.8-1.6-7.6z" fill="#003087"/>
                                </svg>
                                <span class="paypal-text-label">PayPal</span>
                            </div>
                            <div class="paypal-underline"></div>
                        </div>
                    </div>

                    <!-- Card Details Form -->
                    <form id="premiumForm" class="premium-form" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">Card details</label>
                            <div class="card-inputs-row">
                                <div class="card-input-wrapper">
                                    <i class="fas fa-credit-card card-icon"></i>
                                    <input type="text" class="form-control card-input" placeholder="Card number" id="cardNumber" maxlength="19">
                                </div>
                                <input type="text" class="form-control card-input-small" placeholder="MM/YY CVC" id="cardExpiry" maxlength="7">
                            </div>
                        </div>

                        <button type="submit" class="btn-go-premium-large">Go Premium</button>
                    </form>

                    <!-- PayPal Button -->
                    <div id="paypalButtonContainer" class="paypal-button-container">
                        <button type="button" class="btn-paypal">
                            <span class="paypal-button-logo">
                                <svg width="60" height="18" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M30.5 15.5c-1.2-7.8-7.1-13.5-14.8-13.5H5.5c-0.8 0-1.5 0.6-1.6 1.4L0 45.5c-0.1 0.7 0.5 1.3 1.2 1.3h8.5l2.1-13.3c0.1-0.8 0.8-1.4 1.6-1.4h3.2c6.5 0 11.8-5.3 12.9-11.8 0.6-3.2 0-5.8-1.6-7.6z" fill="white"/>
                                    <path d="M30.5 15.5c-1.2-7.8-7.1-13.5-14.8-13.5H5.5c-0.8 0-1.5 0.6-1.6 1.4L0 45.5c-0.1 0.7 0.5 1.3 1.2 1.3h8.5l2.1-13.3c0.1-0.8 0.8-1.4 1.6-1.4h3.2c6.5 0 11.8-5.3 12.9-11.8 0.6-3.2 0-5.8-1.6-7.6z" fill="#009CDE"/>
                                    <path d="M50 15.5c-1.2-7.8-7.1-13.5-14.8-13.5H25c-0.8 0-1.5 0.6-1.6 1.4L19.5 45.5c-0.1 0.7 0.5 1.3 1.2 1.3h8.5l2.1-13.3c0.1-0.8 0.8-1.4 1.6-1.4h3.2c6.5 0 11.8-5.3 12.9-11.8 0.6-3.2 0-5.8-1.6-7.6z" fill="white"/>
                                </svg>
                            </span>
                            <span class="paypal-button-text">PayPal</span>
                        </button>
                    </div>

                    <!-- Guarantees -->
                    <div class="guarantees">
                        <div class="guarantee-item">
                            <i class="fas fa-check-circle guarantee-icon"></i>
                            <span>Cancel anytime</span>
                        </div>
                        <div class="guarantee-item">
                            <i class="fas fa-check-circle guarantee-icon"></i>
                            <span>Money back guarantee</span>
                        </div>
                    </div>

                    <!-- Security Message -->
                    <p class="security-message">
                        Secure. Private. In your control <i class="fas fa-info-circle"></i>
                    </p>
                </div>
            </div>

            <!-- Right Section - Benefits -->
            <div class="col-lg-5 premium-right">
                <div class="premium-benefits">
                    <h2 class="benefits-heading">Upgrade to Premium</h2>
                    <ul class="benefits-list">
                        <li class="benefit-item">
                            <i class="fas fa-check-circle benefit-icon"></i>
                            <span>Full access to iLovePDF tools</span>
                            <i class="fas fa-chevron-down benefit-toggle"></i>
                        </li>
                        <li class="benefit-item">
                            <i class="fas fa-check-circle benefit-icon"></i>
                            <span>Unlimited document processing</span>
                        </li>
                        <li class="benefit-item">
                            <i class="fas fa-check-circle benefit-icon"></i>
                            <span>Work on Web, Mobile and <strong>Desktop</strong></span>
                        </li>
                        <li class="benefit-item">
                            <i class="fas fa-check-circle benefit-icon"></i>
                            <span>Convert scanned PDF to Word with <strong>OCR</strong>, sign with <strong>digital signatures</strong>, convert to <strong>PDF/A</strong></span>
                        </li>
                        <li class="benefit-item">
                            <i class="fas fa-check-circle benefit-icon"></i>
                            <span>No Ads</span>
                        </li>
                        <li class="benefit-item">
                            <i class="fas fa-check-circle benefit-icon"></i>
                            <span>Customer support</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Pricing plan selection
    const pricingPlans = document.querySelectorAll('.pricing-plan');
    pricingPlans.forEach(plan => {
        plan.addEventListener('click', function() {
            pricingPlans.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Payment method selection
    const paymentMethods = document.querySelectorAll('.payment-method-item');
    const premiumForm = document.getElementById('premiumForm');
    const paypalButtonContainer = document.getElementById('paypalButtonContainer');

    // Set initial state - PayPal selected by default
    if (paypalButtonContainer) {
        paypalButtonContainer.style.display = 'block';
    }
    if (premiumForm) {
        premiumForm.style.display = 'none';
    }

    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethods.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            
            const methodType = this.dataset.method;
            if (methodType === 'paypal') {
                if (premiumForm) premiumForm.style.display = 'none';
                if (paypalButtonContainer) paypalButtonContainer.style.display = 'block';
            } else {
                if (premiumForm) premiumForm.style.display = 'block';
                if (paypalButtonContainer) paypalButtonContainer.style.display = 'none';
            }
        });
    });

    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }

    // Card expiry formatting
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // Form submission
    if (premiumForm) {
        premiumForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Here you would typically send the payment data to your backend
            const selectedPlan = document.querySelector('.pricing-plan.active').dataset.plan;
            alert('Premium upgrade processing would be handled here. Plan: ' + selectedPlan);
        });
    }

    // PayPal button click
    const paypalButton = document.querySelector('.btn-paypal');
    if (paypalButton) {
        paypalButton.addEventListener('click', function() {
            // Here you would typically redirect to PayPal or handle PayPal payment
            const selectedPlan = document.querySelector('.pricing-plan.active').dataset.plan;
            alert('PayPal payment processing would be handled here. Plan: ' + selectedPlan);
        });
    }
});
</script>
@endpush
@endsection
