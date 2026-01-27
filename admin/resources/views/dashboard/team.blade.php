@extends('layouts.dashboard')

@section('title', 'Team - I Love PDF')

@push('styles')
<style>
    /* Upgrade Premium Modal Styles - Match Plans Popup */
    #upgradePremiumModal .modal-content {
        max-width: 600px;
    }
    
    #upgradePremiumModal .pricing-plan-modal {
        transition: all 0.3s ease;
    }
    
    #upgradePremiumModal .pricing-plan-modal:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    /* Use same payment method styles as plans popup */
    #upgradePremiumModal .payment-methods-modal {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
    }
    
    /* Card icon opacity on active */
    #upgradePremiumModal .payment-method-item-modal.active .payment-card-icon-modal {
        opacity: 1;
    }
    
    /* Stripe Elements Styling */
    #card-element-modal-team {
        width: 100% !important;
    }
    
    #card-element-modal-team iframe {
        width: 100% !important;
    }
    
    #card-element-modal-team .__PrivateStripeElement {
        width: 100% !important;
    }
    
    #card-element-modal-team:focus-within {
        border-color: #5A26EF;
        box-shadow: 0 0 0 0.2rem rgba(90, 38, 239, 0.25);
    }
</style>
@endpush

@section('content')
<div class="dashboard-page team-page">
    <h1 class="page-title">Workspace</h1>

    <div class="workspace-content">
        <div class="workspace-left">
            <!-- Workspace Description -->
            <div class="workspace-description">
                <div class="description-item">
                    <i class="fas fa-check-circle check-icon"></i>
                    <p>Obtain and manage multiple iLovePDF licenses, inviting several users to your workspace.</p>
                </div>
                <div class="description-item">
                    <i class="fas fa-check-circle check-icon"></i>
                    <p>Organize your workspace into various teams.</p>
                </div>
                <div class="description-item">
                    <i class="fas fa-check-circle check-icon"></i>
                    <p>Set permission roles and assign each member to their team in your workspace.</p>
                </div>
            </div>

            <!-- Workspace Illustration Area -->
            <div class="workspace-illustration">
                <div class="illustration-container">
                    <img src="{{ asset('images/workspace 1.png') }}" alt="Workspace Team Collaboration" class="workspace-illustration-img">
                </div>
            </div>
        </div>

        <!-- Invite Section -->
        <div class="workspace-right">
            <div class="invite-section">
                <h3 class="invite-title">Invite</h3>
                <div class="invite-form">
                    <div class="email-input-group" id="emailInputs">
                        <div class="email-input-wrapper">
                            <input type="email" class="form-control email-input" placeholder="john@gmail.com" name="emails[]">
                            <button type="button" class="btn-add-email" id="addEmailBtn" title="Add another member">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="btn-invite" id="inviteMembersBtn">Invite</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
        <button type="button" class="btn-save" id="saveWorkspaceBtn">Save</button>
        <button type="button" class="btn-cancel" id="cancelWorkspaceBtn">Cancel</button>
    </div>
</div>

<!-- Upgrade to Premium Modal (for Team Invite) -->
<div class="modal fade" id="upgradePremiumModal" tabindex="-1" aria-labelledby="upgradePremiumModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content" style="border-radius: 12px; overflow: hidden;">
            <div class="modal-header" style="background: #2d3748; color: white; border-bottom: none; padding: 20px 30px;">
                <h2 class="modal-title" id="upgradePremiumModalLabel" style="color: #ff702a; font-size: 24px; font-weight: 700;">Upgrade to Premium</h2>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" style="opacity: 1;"></button>
            </div>
            <div class="modal-body" style="padding: 30px;">
                <p style="color: #666; margin-bottom: 25px; font-size: 14px;">
                    Premium users can add team members and get <a href="#" style="color: #5A26EF; text-decoration: underline;">all features</a>.
                </p>

                <!-- Pricing Plans -->
                <div class="pricing-plans-modal" style="display: flex; gap: 15px; margin-bottom: 25px;">
                    <div class="pricing-plan-modal active" data-plan="monthly" style="flex: 1; border: 2px solid #ff702a; border-radius: 8px; padding: 15px; text-align: center; cursor: pointer; background: white;">
                        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Monthly</div>
                        <div style="font-size: 28px; font-weight: 700; color: #333;">$7</div>
                    </div>
                    <div class="pricing-plan-modal" data-plan="yearly" style="flex: 1; border: 2px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; cursor: pointer; background: white; position: relative;">
                        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Yearly</div>
                        <div style="font-size: 28px; font-weight: 700; color: #333;">$48</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">$4 / month</div>
                        <span style="position: absolute; top: -8px; right: -8px; background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">-42%</span>
                    </div>
                </div>

                <!-- Payment Methods -->
                <div class="payment-methods-modal">
                    <div class="payment-method-item-modal active" data-method="card">
                        <svg class="payment-card-icon-modal" width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="32" rx="4" fill="#E3F2FD"/>
                            <rect x="4" y="8" width="8" height="6" rx="1" fill="#FFC107"/>
                            <rect x="4" y="18" width="20" height="2" rx="1" fill="#90CAF9"/>
                            <rect x="4" y="22" width="16" height="2" rx="1" fill="#90CAF9"/>
                            <circle cx="38" cy="22" r="3" fill="#F44336"/>
                            <ellipse cx="42" cy="22" rx="2" ry="3" fill="#FFC107"/>
                        </svg>
                    </div>
                    <div class="payment-method-item-modal paypal-tab-modal" data-method="paypal">
                        <div class="paypal-content-wrapper-modal">
                            <svg class="paypal-logo-icon-modal" width="24" height="24" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                                <path d="M30.5 15.5c-1.2-7.8-7.1-13.5-14.8-13.5H5.5c-0.8 0-1.5 0.6-1.6 1.4L0 45.5c-0.1 0.7 0.5 1.3 1.2 1.3h8.5l2.1-13.3c0.1-0.8 0.8-1.4 1.6-1.4h3.2c6.5 0 11.8-5.3 12.9-11.8 0.6-3.2 0-5.8-1.6-7.6z" fill="#003087"/>
                                <path d="M30.5 15.5c-1.2-7.8-7.1-13.5-14.8-13.5H5.5c-0.8 0-1.5 0.6-1.6 1.4L0 45.5c-0.1 0.7 0.5 1.3 1.2 1.3h8.5l2.1-13.3c0.1-0.8 0.8-1.4 1.6-1.4h3.2c6.5 0 11.8-5.3 12.9-11.8 0.6-3.2 0-5.8-1.6-7.6z" fill="#009CDE"/>
                                <path d="M50 15.5c-1.2-7.8-7.1-13.5-14.8-13.5H25c-0.8 0-1.5 0.6-1.6 1.4L19.5 45.5c-0.1 0.7 0.5 1.3 1.2 1.3h8.5l2.1-13.3c0.1-0.8 0.8-1.4 1.6-1.4h3.2c6.5 0 11.8-5.3 12.9-11.8 0.6-3.2 0-5.8-1.6-7.6z" fill="#003087"/>
                            </svg>
                            <span class="paypal-text-label-modal">PayPal</span>
                        </div>
                        <div class="paypal-underline-modal"></div>
                    </div>
                </div>

                <!-- Card Details Form with Stripe Elements -->
                <div class="card-details-section" id="cardDetailsSectionTeam">
                    <h6 class="section-label">Card details</h6>
                    <div id="card-element-modal-team" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                        <!-- Stripe Elements will create form elements here -->
                    </div>
                    <div id="card-errors-modal-team" role="alert" style="color: #dc3545; font-size: 14px; margin-top: 8px; min-height: 20px;"></div>
                </div>

                <!-- PayPal Button -->
                <div id="paypalButtonContainerModalTeam" class="paypal-button-container-modal" style="display: none;">
                    <button type="button" class="btn-paypal-modal" id="paypalPaymentBtnTeam">
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

                <button type="button" class="btn-confirm-payment" id="confirmPaymentBtnTeam">Go Premium</button>

                <p class="security-text" style="margin-top: 20px; margin-bottom: 0; font-size: 12px; color: #6B7280;">
                    Secure. Private. In your control <i class="fas fa-info-circle"></i>
                </p>
            </div>
        </div>
    </div>
</div>
@endsection

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

    // Open upgrade to premium modal when clicking "Invite" button
    const inviteMembersBtn = document.getElementById('inviteMembersBtn');
    const upgradeModal = new bootstrap.Modal(document.getElementById('upgradePremiumModal'));
    
    if (inviteMembersBtn) {
        inviteMembersBtn.addEventListener('click', function() {
            upgradeModal.show();
            
            // Initialize Stripe Elements when modal is shown
            setTimeout(() => {
                if (!cardElement && document.getElementById('card-element-modal-team')) {
                    initializeStripeElements();
                }
            }, 400);
        });
    }

    // Plan selection in modal
    const pricingPlansModal = document.querySelectorAll('.pricing-plan-modal');
    pricingPlansModal.forEach(plan => {
        plan.addEventListener('click', function() {
            pricingPlansModal.forEach(p => {
                p.classList.remove('active');
                p.style.borderColor = '#ddd';
            });
            this.classList.add('active');
            this.style.borderColor = '#ff702a';
        });
    });

    // Payment method selection in modal
    const paymentMethodsModalTeam = document.querySelectorAll('#upgradePremiumModal .payment-method-item-modal');
    const cardDetailsSectionTeam = document.getElementById('cardDetailsSectionTeam');
    const paypalButtonContainerModalTeam = document.getElementById('paypalButtonContainerModalTeam');
    const confirmPaymentBtnTeam = document.getElementById('confirmPaymentBtnTeam');

    // Set initial state - Card selected by default
    if (paypalButtonContainerModalTeam) {
        paypalButtonContainerModalTeam.style.display = 'none';
    }
    if (cardDetailsSectionTeam) {
        cardDetailsSectionTeam.style.display = 'block';
    }
    if (confirmPaymentBtnTeam) {
        confirmPaymentBtnTeam.style.display = 'block';
    }

    paymentMethodsModalTeam.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethodsModalTeam.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            
            const methodType = this.dataset.method;
            if (methodType === 'paypal') {
                if (cardDetailsSectionTeam) cardDetailsSectionTeam.style.display = 'none';
                if (paypalButtonContainerModalTeam) paypalButtonContainerModalTeam.style.display = 'block';
                if (confirmPaymentBtnTeam) confirmPaymentBtnTeam.style.display = 'none';
                // Unmount card element
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
                if (cardDetailsSectionTeam) cardDetailsSectionTeam.style.display = 'block';
                if (paypalButtonContainerModalTeam) paypalButtonContainerModalTeam.style.display = 'none';
                if (confirmPaymentBtnTeam) confirmPaymentBtnTeam.style.display = 'block';
                
                // Initialize Stripe Elements
                setTimeout(() => {
                    if (!cardElement && document.getElementById('card-element-modal-team')) {
                        initializeStripeElements();
                    }
                }, 100);
            }
        });
    });

    // Initialize Stripe Elements
    function initializeStripeElements() {
        const cardElementContainer = document.getElementById('card-element-modal-team');
        if (!cardElementContainer) {
            console.error('Card element container not found');
            return;
        }

        if (cardElementContainer.offsetParent === null) {
            console.error('Card element container is not visible');
            return;
        }

        if (cardElement) {
            return;
        }

        try {
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
            
            cardElement.mount('#card-element-modal-team');

            cardElement.on('change', function(event) {
                const displayError = document.getElementById('card-errors-modal-team');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            });

            console.log('Stripe Elements initialized successfully');
        } catch (error) {
            console.error('Error initializing Stripe Elements:', error);
            const displayError = document.getElementById('card-errors-modal-team');
            if (displayError) {
                displayError.textContent = 'Error loading payment form. Please refresh the page.';
            }
        }
    }

    // Confirm payment button (for card payment)
    if (confirmPaymentBtnTeam) {
        confirmPaymentBtnTeam.addEventListener('click', async function() {
            const selectedPlan = document.querySelector('#upgradePremiumModal .pricing-plan-modal.active')?.dataset.plan || 'monthly';
            
            const planPrices = {
                'monthly': { type: 'premium_monthly', amount: 7.00 },
                'yearly': { type: 'premium_yearly', amount: 48.00 }
            };
            
            const planDetails = planPrices[selectedPlan];
            if (!planDetails) {
                alert('Invalid plan selected');
                return;
            }

            const button = this;
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Processing...';

            try {
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

                const { error, paymentIntent } = await stripe.confirmCardPayment(
                    paymentIntentClientSecret,
                    {
                        payment_method: {
                            card: cardElement,
                        }
                    }
                );

                if (error) {
                    const displayError = document.getElementById('card-errors-modal-team');
                    displayError.textContent = error.message;
                    button.disabled = false;
                    button.textContent = originalText;
                } else {
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
                        alert('Payment successful! Your premium subscription is now active. You can now invite team members.');
                        upgradeModal.hide();
                        window.location.reload();
                    } else {
                        throw new Error(confirmData.message || 'Payment confirmation failed');
                    }
                }
            } catch (error) {
                console.error('Payment error:', error);
                const displayError = document.getElementById('card-errors-modal-team');
                displayError.textContent = error.message || 'An error occurred. Please try again.';
                button.disabled = false;
                button.textContent = originalText;
            }
        });
    }

    // PayPal button click
    const paypalButtonModal = document.getElementById('paypalPaymentBtnTeam');
    if (paypalButtonModal) {
        paypalButtonModal.addEventListener('click', function() {
            const selectedPlan = document.querySelector('#upgradePremiumModal .pricing-plan-modal.active')?.dataset.plan || 'monthly';
            alert('PayPal payment integration coming soon. Plan: ' + selectedPlan);
        });
    }

    // Reset when modal is hidden
    const upgradeModalElement = document.getElementById('upgradePremiumModal');
    if (upgradeModalElement) {
        upgradeModalElement.addEventListener('hidden.bs.modal', function() {
            if (cardElement) {
                try {
                    cardElement.unmount();
                    cardElement = null;
                    elements = null;
                } catch(e) {
                    console.log('Error unmounting:', e);
                }
            }
            paymentIntentClientSecret = null;
            subscriptionId = null;
        });
    }
});
</script>
@endpush
