@extends('layouts.dashboard')

@section('title', 'Plans and Packages - I Love PDF')

@section('content')
<div class="dashboard-page plans-page">
    <div class="plans-header">
        <h1 class="page-title">Plans and packages</h1>
        <div class="plans-subheader">
            <span class="subheading">My Account</span>
            <span class="total-files">Total Files: 5</span>
        </div>
    </div>

    <div class="plans-content">
        <div class="row g-4">
            <!-- Subscription Details Card -->
            <div class="col-lg-6">
                <div class="plans-card subscription-card">
                    <h3 class="card-title">Subscription details</h3>
                    <p class="card-description">Get full access to all iLovePDF features. Enjoy simple and fast PDF tools to convert, edit and e-sign your documents.</p>
                    <div class="current-plan">
                        <span class="plan-price">$39</span>
                        <span class="plan-period">Month Active</span>
                    </div>
                    <a href="{{ route('dashboard.premium') }}" class="btn-go-premium">Go For Premium</a>
                </div>
            </div>

            <!-- Packages Card -->
            <div class="col-lg-6">
                <div class="plans-card packages-card">
                    <h3 class="card-title">Packages</h3>
                    <div class="signatures-status">
                        <span>Signatures: 0</span>
                        <i class="fas fa-plus-circle signature-add-icon"></i>
                    </div>
                    <div class="package-options">
                        <div class="package-option" data-package="5" data-price="6.00">
                            <div class="package-info">
                                <span class="package-count">5 Signatures</span>
                                <span class="package-price">$6.00</span>
                            </div>
                            <i class="fas fa-check-circle package-check"></i>
                        </div>
                        <div class="package-option" data-package="10" data-price="10.00">
                            <div class="package-info">
                                <span class="package-count">10 Signatures</span>
                                <span class="package-price">$10.00</span>
                            </div>
                            <i class="fas fa-check-circle package-check"></i>
                        </div>
                        <div class="package-option" data-package="30" data-price="40.00">
                            <div class="package-info">
                                <span class="package-count">30 Signatures</span>
                                <span class="package-price">$40.00</span>
                            </div>
                            <i class="fas fa-check-circle package-check"></i>
                        </div>
                        <div class="package-option" data-package="50" data-price="6.00">
                            <div class="package-info">
                                <span class="package-count">50 Signatures</span>
                                <span class="package-price">$6.00</span>
                            </div>
                            <i class="fas fa-check-circle package-check"></i>
                        </div>
                    </div>
                    <button type="button" class="btn-checkout" id="proceedCheckoutBtn">Proceed to checkout</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons" style="display: none;">
        <button type="button" class="btn-save">Save</button>
        <button type="button" class="btn-cancel">Cancel</button>
    </div>
</div>

<!-- Order Summary Modal -->
<div class="modal fade" id="orderSummaryModal" tabindex="-1" aria-labelledby="orderSummaryModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content order-summary-modal">
            <div class="modal-header">
                <a href="#" class="back-link" data-bs-dismiss="modal">< Back</a>
                <h5 class="modal-title" id="orderSummaryModalLabel">Order Summary</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="purchase-details">
                    <h6 class="section-label">Purchase Details</h6>
                    <div class="purchase-item">
                        <span class="item-name" id="orderPackageName">10 - Signatures</span>
                        <span class="item-price" id="orderPackagePrice">$11</span>
                    </div>
                </div>

                <div class="payment-methods-modal">
                    <div class="payment-method-item-modal" data-method="card">
                        <svg class="payment-card-icon-modal" width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="32" rx="4" fill="#E3F2FD"/>
                            <rect x="4" y="8" width="8" height="6" rx="1" fill="#FFC107"/>
                            <rect x="4" y="18" width="20" height="2" rx="1" fill="#90CAF9"/>
                            <rect x="4" y="22" width="16" height="2" rx="1" fill="#90CAF9"/>
                            <circle cx="38" cy="22" r="3" fill="#F44336"/>
                            <ellipse cx="42" cy="22" rx="2" ry="3" fill="#FFC107"/>
                        </svg>
                    </div>
                    <div class="payment-method-item-modal paypal-tab-modal active" data-method="paypal">
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

                <div class="card-details-section" id="cardDetailsSection" style="display: none;">
                    <h6 class="section-label">Card details</h6>
                    <div class="card-inputs">
                        <div class="card-input-wrapper">
                            <i class="fas fa-credit-card card-icon"></i>
                            <input type="text" class="form-control card-input" placeholder="Card number" id="cardNumber">
                        </div>
                        <input type="text" class="form-control card-input-small" placeholder="MM / YY CVC" id="cardExpiry">
                    </div>
                </div>

                <div id="paypalButtonContainerModal" class="paypal-button-container-modal">
                    <button type="button" class="btn-paypal-modal" id="paypalPaymentBtn">
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

                <button type="button" class="btn-confirm-payment" id="confirmPaymentBtn" style="display: none;">Confirm payment</button>

                <p class="security-text">
                    Secure. Private. In your control <i class="fas fa-info-circle"></i>
                </p>

                <div class="security-badges">
                    <div class="security-badge">
                        <span>PDF association</span>
                    </div>
                    <div class="security-badge">
                        <span>ISO 27001</span>
                    </div>
                    <div class="security-badge">
                        <i class="fas fa-shield-alt"></i>
                        <span>Secure Payment</span>
                    </div>
                    <div class="security-badge">
                        <i class="fas fa-lock"></i>
                        <span>SECURE SSL ENCRYPTION</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    let selectedPackage = null;
    let selectedPrice = null;

    // Package selection
    const packageOptions = document.querySelectorAll('.package-option');
    packageOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all
            packageOptions.forEach(opt => opt.classList.remove('active'));
            // Add active class to clicked
            this.classList.add('active');
            
            selectedPackage = this.dataset.package;
            selectedPrice = this.dataset.price;
        });
    });

    // Set default selection (first package)
    if (packageOptions.length > 0) {
        packageOptions[0].classList.add('active');
        selectedPackage = packageOptions[0].dataset.package;
        selectedPrice = packageOptions[0].dataset.price;
    }

    // Proceed to checkout button
    const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');
    if (proceedCheckoutBtn) {
        proceedCheckoutBtn.addEventListener('click', function() {
            if (!selectedPackage || !selectedPrice) {
                alert('Please select a package');
                return;
            }

            // Update modal content
            const orderPackageName = document.getElementById('orderPackageName');
            const orderPackagePrice = document.getElementById('orderPackagePrice');
            
            if (orderPackageName) {
                orderPackageName.textContent = `${selectedPackage} - Signatures`;
            }
            if (orderPackagePrice) {
                orderPackagePrice.textContent = `$${selectedPrice}`;
            }

            // Show modal
            const modalElement = document.getElementById('orderSummaryModal');
            if (modalElement && typeof bootstrap !== 'undefined') {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else if (modalElement) {
                // Fallback if Bootstrap is not loaded
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
                document.body.classList.add('modal-open');
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        });
    }

    // Payment method selection in modal
    const modalElement = document.getElementById('orderSummaryModal');
    const paymentMethodsModal = document.querySelectorAll('.payment-method-item-modal');
    const cardDetailsSection = document.getElementById('cardDetailsSection');
    const paypalButtonContainerModal = document.getElementById('paypalButtonContainerModal');
    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');

    // Set initial state - PayPal selected by default
    if (paypalButtonContainerModal) {
        paypalButtonContainerModal.style.display = 'block';
    }
    if (cardDetailsSection) {
        cardDetailsSection.style.display = 'none';
    }
    if (confirmPaymentBtn) {
        confirmPaymentBtn.style.display = 'none';
    }

    paymentMethodsModal.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethodsModal.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            
            const methodType = this.dataset.method;
            if (methodType === 'paypal') {
                if (cardDetailsSection) cardDetailsSection.style.display = 'none';
                if (paypalButtonContainerModal) paypalButtonContainerModal.style.display = 'block';
                if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'none';
            } else {
                if (cardDetailsSection) cardDetailsSection.style.display = 'block';
                if (paypalButtonContainerModal) paypalButtonContainerModal.style.display = 'none';
                if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'block';
            }
        });
    });

    // PayPal button click in modal
    const paypalPaymentBtn = document.getElementById('paypalPaymentBtn');
    if (paypalPaymentBtn) {
        paypalPaymentBtn.addEventListener('click', function() {
            // Here you would typically redirect to PayPal or handle PayPal payment
            alert('PayPal payment processing would be handled here. Package: ' + selectedPackage + ' signatures, Price: $' + selectedPrice);
            // Close modal after processing
            const modal = bootstrap.Modal.getInstance(document.getElementById('orderSummaryModal'));
            if (modal) {
                modal.hide();
            }
        });
    }

    // Confirm payment button
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', function() {
            // Here you would typically send the payment data to your backend
            alert('Payment processing would be handled here. Package: ' + selectedPackage + ' signatures, Price: $' + selectedPrice);
            // Close modal after processing
            const modal = bootstrap.Modal.getInstance(document.getElementById('orderSummaryModal'));
            if (modal) {
                modal.hide();
            }
        });
    }
});
</script>
@endpush
@endsection
