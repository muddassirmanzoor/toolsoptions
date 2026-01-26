@extends('layouts.dashboard')

@section('title', 'Upgrade to Premium - I Love PDF')

@push('styles')
<style>
    /* Stripe Elements Styling */
    #card-element {
        width: 100% !important;
    }
    
    #card-element iframe {
        width: 100% !important;
    }
    
    /* Ensure Stripe Elements container is interactive */
    #card-element .__PrivateStripeElement {
        width: 100% !important;
    }
    
    /* Make sure the form is visible when shown */
    #premiumForm[style*="display: block"] {
        display: block !important;
    }
    
    /* Card element container styling */
    #card-element {
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    
    #card-element:focus-within {
        border-color: #5A26EF;
        box-shadow: 0 0 0 0.2rem rgba(90, 38, 239, 0.25);
    }
</style>
@endpush

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
                        <div class="payment-method-item active" data-method="card">
                            <svg class="payment-card-icon" width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="48" height="32" rx="4" fill="#E3F2FD"/>
                                <rect x="4" y="8" width="8" height="6" rx="1" fill="#FFC107"/>
                                <rect x="4" y="18" width="20" height="2" rx="1" fill="#90CAF9"/>
                                <rect x="4" y="22" width="16" height="2" rx="1" fill="#90CAF9"/>
                                <circle cx="38" cy="22" r="3" fill="#F44336"/>
                                <ellipse cx="42" cy="22" rx="2" ry="3" fill="#FFC107"/>
                            </svg>
                        </div>
                        <div class="payment-method-item paypal-tab" data-method="paypal">
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

                    <!-- Card Details Form with Stripe Elements -->
                    <form id="premiumForm" class="premium-form">
                        <div class="form-group">
                            <label class="form-label">Card details</label>
                            <div id="card-element" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <!-- Stripe Elements will create form elements here -->
                            </div>
                            <div id="card-errors" role="alert" style="color: #dc3545; font-size: 14px; margin-top: 8px; min-height: 20px;"></div>
                        </div>

                        <button type="submit" class="btn-go-premium-large" id="submit-button">
                            <span id="button-text">Go Premium</span>
                            <span id="spinner" style="display: none;">
                                <i class="fas fa-spinner fa-spin"></i> Processing...
                            </span>
                        </button>
                    </form>

                    <!-- PayPal Button -->
                    <div id="paypalButtonContainer" class="paypal-button-container" style="display: none;">
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
<script src="https://js.stripe.com/v3/"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Stripe
    const stripe = Stripe('{{ config("services.stripe.key") }}');
    let elements;
    let cardElement;
    let paymentIntentClientSecret = null;
    let subscriptionId = null;

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

    // Set initial state - Card selected by default
    if (paypalButtonContainer) {
        paypalButtonContainer.style.display = 'none';
    }
    if (premiumForm) {
        premiumForm.style.display = 'block';
    }
    
    // Initialize Stripe Elements on page load (card is default)
    setTimeout(() => {
        if (!cardElement) {
            initializeStripeElements();
        }
    }, 300);

    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethods.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            
            const methodType = this.dataset.method;
            if (methodType === 'paypal') {
                if (premiumForm) premiumForm.style.display = 'none';
                if (paypalButtonContainer) paypalButtonContainer.style.display = 'block';
                // Unmount card element when switching to PayPal
                if (cardElement) {
                    try {
                        cardElement.unmount();
                        cardElement = null;
                        elements = null;
                    } catch(e) {
                        console.log('Card element already unmounted');
                    }
                }
            } else {
                if (premiumForm) premiumForm.style.display = 'block';
                if (paypalButtonContainer) paypalButtonContainer.style.display = 'none';
                // Initialize Stripe Elements when card method is selected
                // Wait for the form to be visible and rendered before mounting
                setTimeout(() => {
                    // Unmount existing element if any
                    if (cardElement) {
                        try {
                            cardElement.unmount();
                            cardElement = null;
                            elements = null;
                        } catch(e) {
                            console.log('Error unmounting:', e);
                        }
                    }
                    // Clear container
                    const container = document.getElementById('card-element');
                    if (container) {
                        container.innerHTML = '';
                    }
                    // Initialize fresh
                    initializeStripeElements();
                }, 200);
            }
        });
    });

    // Initialize Stripe Elements
    function initializeStripeElements() {
        const cardElementContainer = document.getElementById('card-element');
        if (!cardElementContainer) {
            console.error('Card element container not found');
            return;
        }

        // Check if already mounted
        if (cardElement) {
            return;
        }

        // Make sure container is visible
        if (cardElementContainer.offsetParent === null) {
            console.error('Card element container is not visible');
            return;
        }

        try {
            // Clear any existing content
            cardElementContainer.innerHTML = '';
            
            elements = stripe.elements();
            
            const style = {
                base: {
                    fontSize: '16px',
                    color: '#32325d',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
                invalid: {
                    color: '#fa755a',
                    iconColor: '#fa755a',
                },
            };

            cardElement = elements.create('card', { 
                style: style,
                hidePostalCode: false
            });
            
            cardElement.mount('#card-element');

            // Handle real-time validation errors from the card Element
            cardElement.on('change', function(event) {
                const displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            });

            // Handle focus events
            cardElement.on('focus', function() {
                console.log('Card element focused');
            });

            // Handle blur events
            cardElement.on('blur', function() {
                console.log('Card element blurred');
            });

            console.log('Stripe Elements initialized successfully');
        } catch (error) {
            console.error('Error initializing Stripe Elements:', error);
            const displayError = document.getElementById('card-errors');
            if (displayError) {
                displayError.textContent = 'Error loading payment form. Please refresh the page.';
            }
        }
    }

    // Form submission
    if (premiumForm) {
        premiumForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = document.getElementById('submit-button');
            const buttonText = document.getElementById('button-text');
            const spinner = document.getElementById('spinner');
            const selectedPlan = document.querySelector('.pricing-plan.active').dataset.plan;
            
            // Get plan details
            const planPrices = {
                'monthly': { type: 'premium_monthly', amount: 7.00 },
                'yearly': { type: 'premium_yearly', amount: 48.00 }
            };
            
            const planDetails = planPrices[selectedPlan];
            if (!planDetails) {
                alert('Invalid plan selected');
                return;
            }

            // Disable button
            submitButton.disabled = true;
            buttonText.style.display = 'none';
            spinner.style.display = 'inline';

            try {
                // Create payment intent if not already created
                if (!paymentIntentClientSecret) {
                    const response = await fetch('{{ route("payment.create-intent") }}', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': '{{ csrf_token() }}',
                        },
                        body: JSON.stringify({
                            plan_type: planDetails.type,
                            amount: planDetails.amount,
                        }),
                    });

                    const data = await response.json();
                    
                    if (!data.success) {
                        throw new Error(data.message || 'Failed to create payment');
                    }

                    paymentIntentClientSecret = data.client_secret;
                    subscriptionId = data.subscription_id;
                }

                // Confirm payment with Stripe
                const { error, paymentIntent } = await stripe.confirmCardPayment(
                    paymentIntentClientSecret,
                    {
                        payment_method: {
                            card: cardElement,
                        }
                    }
                );

                if (error) {
                    // Show error to user
                    const displayError = document.getElementById('card-errors');
                    displayError.textContent = error.message;
                    submitButton.disabled = false;
                    buttonText.style.display = 'inline';
                    spinner.style.display = 'none';
                } else {
                    // Payment succeeded - confirm on backend
                    const confirmResponse = await fetch('{{ route("payment.confirm") }}', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': '{{ csrf_token() }}',
                        },
                        body: JSON.stringify({
                            payment_intent_id: paymentIntent.id,
                            subscription_id: subscriptionId,
                        }),
                    });

                    const confirmData = await confirmResponse.json();
                    
                    if (confirmData.success) {
                        // Success - redirect or show success message
                        alert('Payment successful! Your premium subscription is now active.');
                        window.location.href = '{{ route("dashboard.plans") }}';
                    } else {
                        throw new Error(confirmData.message || 'Payment confirmation failed');
                    }
                }
            } catch (error) {
                console.error('Payment error:', error);
                const displayError = document.getElementById('card-errors');
                displayError.textContent = error.message || 'An error occurred. Please try again.';
                submitButton.disabled = false;
                buttonText.style.display = 'inline';
                spinner.style.display = 'none';
            }
        });
    }

    // PayPal button click
    const paypalButton = document.querySelector('.btn-paypal');
    if (paypalButton) {
        paypalButton.addEventListener('click', function() {
            // PayPal integration will be added later
            const selectedPlan = document.querySelector('.pricing-plan.active').dataset.plan;
            alert('PayPal payment integration coming soon. Plan: ' + selectedPlan);
        });
    }
});
</script>
@endpush
@endsection
