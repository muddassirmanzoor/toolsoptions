# Payment Integration Guide - Card & PayPal

This document outlines what needs to be integrated for both **Card Payment** and **PayPal Payment** methods in the premium plan checkout.

---

## Overview

You currently have:
- ✅ Frontend UI for both payment methods (card and PayPal) in `premium.blade.php` and `plans.blade.php`
- ✅ Payment method selection UI
- ❌ Backend payment processing (currently placeholder alerts)
- ❌ Payment gateway integration
- ❌ Database tables for subscriptions/payments
- ❌ Payment routes and controllers

---

## 1. CARD PAYMENT INTEGRATION

### Recommended Solution: **Stripe**

Stripe is the most popular and secure payment gateway for card payments. It handles PCI compliance, supports multiple card types, and provides excellent developer tools.

### What's Required for Card Payment:

#### A. Backend Requirements

1. **Install Stripe PHP SDK**
   ```bash
   cd admin
   composer require stripe/stripe-php
   ```

2. **Environment Variables** (add to `.env`)
   ```env
   STRIPE_KEY=pk_test_... (Publishable key - for frontend)
   STRIPE_SECRET=sk_test_... (Secret key - for backend)
   STRIPE_WEBHOOK_SECRET=whsec_... (For webhook verification)
   ```

3. **Database Migrations** - Create tables for:
   - `subscriptions` - Store subscription details
   - `payments` - Store payment transactions
   - `payment_methods` - Store saved payment methods (optional)

4. **Backend Controller** - Create `PaymentController` with:
   - `createPaymentIntent()` - Create Stripe PaymentIntent
   - `confirmPayment()` - Confirm payment after card details
   - `handleWebhook()` - Handle Stripe webhooks for payment status

5. **Routes** - Add payment routes:
   ```php
   POST /api/payment/create-intent
   POST /api/payment/confirm
   POST /api/payment/webhook
   ```

#### B. Frontend Requirements

1. **Stripe.js Library** - Include in blade template:
   ```html
   <script src="https://js.stripe.com/v3/"></script>
   ```

2. **Stripe Elements** - Replace current card input with Stripe Elements:
   - Card Number field (auto-formatted, validated)
   - Expiry field
   - CVC field
   - Cardholder name (optional but recommended)

3. **Payment Flow**:
   ```
   User enters card details → 
   Create PaymentIntent on backend → 
   Confirm payment with Stripe → 
   Handle success/error → 
   Update subscription status
   ```

#### C. Security Requirements

- ✅ **Never store card details** - Stripe handles this
- ✅ **Use HTTPS** - Required for Stripe
- ✅ **Validate on backend** - Never trust frontend data
- ✅ **Webhook verification** - Verify webhook signatures
- ✅ **PCI Compliance** - Stripe handles this (you don't need PCI certification)

#### D. Required Stripe Account Setup

1. Create account at https://stripe.com
2. Get API keys (test mode first)
3. Set up webhook endpoint
4. Configure webhook events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

---

## 2. PAYPAL PAYMENT INTEGRATION

### Recommended Solution: **PayPal REST API** or **PayPal SDK**

PayPal offers multiple integration options. For subscriptions, use PayPal Subscriptions API.

### What's Required for PayPal Payment:

#### A. Backend Requirements

1. **Install PayPal SDK** (choose one):
   ```bash
   # Option 1: Official PayPal SDK
   composer require paypal/rest-api-sdk-php
   
   # Option 2: Laravel PayPal Package (easier)
   composer require srmklive/paypal
   ```

2. **Environment Variables** (add to `.env`)
   ```env
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_client_secret
   PAYPAL_MODE=sandbox  # or 'live' for production
   PAYPAL_WEBHOOK_ID=your_webhook_id
   ```

3. **Database Migrations** - Same tables as card payment:
   - `subscriptions` - Store subscription details
   - `payments` - Store payment transactions
   - Add `paypal_order_id` and `paypal_subscription_id` fields

4. **Backend Controller** - Add PayPal methods to `PaymentController`:
   - `createPayPalOrder()` - Create PayPal order/subscription
   - `capturePayPalOrder()` - Capture payment after approval
   - `handlePayPalWebhook()` - Handle PayPal webhooks

5. **Routes** - Add PayPal routes:
   ```php
   POST /api/payment/paypal/create-order
   POST /api/payment/paypal/capture
   POST /api/payment/paypal/webhook
   ```

#### B. Frontend Requirements

1. **PayPal JavaScript SDK** - Include in blade template:
   ```html
   <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD&intent=subscription"></script>
   ```

2. **PayPal Buttons** - Replace current PayPal button with:
   - PayPal Smart Buttons (recommended)
   - Or PayPal Subscription buttons for recurring payments

3. **Payment Flow**:
   ```
   User clicks PayPal button → 
   PayPal popup/redirect → 
   User approves on PayPal → 
   PayPal redirects back → 
   Capture payment on backend → 
   Update subscription status
   ```

#### C. Security Requirements

- ✅ **Verify webhook signatures** - PayPal sends signed webhooks
- ✅ **Validate payment amounts** - Prevent price manipulation
- ✅ **Use HTTPS** - Required for PayPal
- ✅ **Store PayPal transaction IDs** - For refunds/disputes

#### D. Required PayPal Account Setup

1. Create PayPal Business account at https://www.paypal.com/business
2. Go to Developer Dashboard: https://developer.paypal.com
3. Create App to get Client ID and Secret
4. Set up webhook endpoint
5. Configure webhook events:
   - `PAYMENT.SALE.COMPLETED`
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.UPDATED`

---

## 3. DATABASE SCHEMA

### Required Tables:

#### `subscriptions` table:
```php
Schema::create('subscriptions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('type'); // 'premium_monthly' or 'premium_yearly'
    $table->string('status'); // 'active', 'cancelled', 'expired', 'pending'
    $table->string('payment_method'); // 'stripe', 'paypal'
    $table->string('payment_gateway_id')->nullable(); // Stripe subscription ID or PayPal subscription ID
    $table->decimal('amount', 10, 2);
    $table->string('currency', 3)->default('USD');
    $table->timestamp('starts_at')->nullable();
    $table->timestamp('ends_at')->nullable();
    $table->timestamp('cancelled_at')->nullable();
    $table->timestamps();
});
```

#### `payments` table:
```php
Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('subscription_id')->nullable()->constrained()->onDelete('set null');
    $table->string('payment_method'); // 'stripe', 'paypal'
    $table->string('gateway_payment_id'); // Stripe payment_intent_id or PayPal order_id
    $table->string('status'); // 'pending', 'completed', 'failed', 'refunded'
    $table->decimal('amount', 10, 2);
    $table->string('currency', 3)->default('USD');
    $table->json('metadata')->nullable(); // Store additional payment data
    $table->timestamps();
});
```

---

## 4. IMPLEMENTATION CHECKLIST

### Backend Tasks:
- [ ] Install Stripe PHP SDK
- [ ] Install PayPal SDK/Package
- [ ] Create database migrations for subscriptions and payments
- [ ] Create `Subscription` model
- [ ] Create `Payment` model
- [ ] Create `PaymentController` with methods for both gateways
- [ ] Add payment routes
- [ ] Implement Stripe PaymentIntent creation
- [ ] Implement Stripe payment confirmation
- [ ] Implement PayPal order creation
- [ ] Implement PayPal payment capture
- [ ] Set up webhook handlers for both gateways
- [ ] Add environment variables
- [ ] Add error handling and logging

### Frontend Tasks:
- [ ] Include Stripe.js library
- [ ] Replace card input with Stripe Elements
- [ ] Include PayPal JavaScript SDK
- [ ] Replace PayPal button with PayPal Smart Buttons
- [ ] Update JavaScript to call backend APIs
- [ ] Handle payment success/error responses
- [ ] Show loading states during payment
- [ ] Update UI after successful payment

### Testing Tasks:
- [ ] Test Stripe test mode payments
- [ ] Test PayPal sandbox payments
- [ ] Test webhook handling
- [ ] Test subscription creation
- [ ] Test error scenarios
- [ ] Test payment cancellation
- [ ] Test refunds (if needed)

### Security Tasks:
- [ ] Verify all payments are validated on backend
- [ ] Set up webhook signature verification
- [ ] Add rate limiting to payment endpoints
- [ ] Add CSRF protection
- [ ] Log all payment attempts
- [ ] Set up monitoring/alerts

---

## 5. ALTERNATIVE OPTIONS

### For Card Payments:
- **Stripe** (Recommended) - Most popular, best documentation
- **Square** - Good alternative
- **Braintree** (PayPal owned) - If you want one provider for both
- **Authorize.Net** - Enterprise option

### For PayPal:
- **PayPal REST API** (Recommended) - Official, most flexible
- **PayPal SDK** - Easier integration
- **Braintree** - Can handle both cards and PayPal

---

## 6. RECOMMENDED APPROACH

**Best Practice**: Use **Stripe for cards** and **PayPal SDK for PayPal**. This gives you:
- Best card payment experience (Stripe)
- Native PayPal integration
- Two independent payment methods (redundancy)
- Industry-standard security

---

## 7. NEXT STEPS

1. **Choose payment gateways** (recommended: Stripe + PayPal)
2. **Set up developer accounts** and get API keys
3. **Create database migrations**
4. **Install required packages**
5. **Implement backend payment processing**
6. **Update frontend to use payment SDKs**
7. **Test in sandbox/test mode**
8. **Set up webhooks**
9. **Test end-to-end flow**
10. **Deploy to production**

---

## 8. COST CONSIDERATIONS

### Stripe:
- **Transaction fee**: 2.9% + $0.30 per successful card charge
- **No monthly fee**
- **No setup fee**

### PayPal:
- **Transaction fee**: 2.9% + $0.30 per transaction (similar to Stripe)
- **No monthly fee**
- **No setup fee**

Both are pay-as-you-go with similar pricing.

---

## 9. SUPPORT & DOCUMENTATION

- **Stripe Docs**: https://stripe.com/docs
- **PayPal Docs**: https://developer.paypal.com/docs
- **Laravel Payment Packages**: 
  - Laravel Cashier (Stripe): https://laravel.com/docs/billing
  - Laravel PayPal: https://github.com/srmklive/laravel-paypal

---

## Questions?

If you need help implementing any specific part, let me know which payment gateway you'd like to use and I can provide detailed code examples.
