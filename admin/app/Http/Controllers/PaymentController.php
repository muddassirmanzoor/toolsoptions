<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Exception\ApiErrorException;

class PaymentController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Create a Stripe PaymentIntent for card payment.
     */
    public function createPaymentIntent(Request $request)
    {
        $request->validate([
            'plan_type' => 'required|string|in:premium_monthly,premium_yearly,signature_package',
            'amount' => 'required|numeric|min:0.01',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $user = $request->user();
        $planType = $request->plan_type;
        $amount = $request->amount;
        $quantity = $request->quantity ?? 1;

        // Calculate amount in cents
        $amountInCents = (int)($amount * 100);

        try {
            // Create PaymentIntent
            $paymentIntent = PaymentIntent::create([
                'amount' => $amountInCents,
                'currency' => 'usd',
                'metadata' => [
                    'user_id' => $user->id,
                    'plan_type' => $planType,
                    'quantity' => $quantity,
                ],
            ]);

            // Create pending subscription
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'type' => $planType,
                'status' => 'pending',
                'payment_method' => 'stripe',
                'payment_gateway_id' => null, // Will be set after payment confirmation
                'amount' => $amount,
                'currency' => 'USD',
                'quantity' => $quantity,
                'metadata' => [
                    'payment_intent_id' => $paymentIntent->id,
                ],
            ]);

            // Create pending payment record
            Payment::create([
                'user_id' => $user->id,
                'subscription_id' => $subscription->id,
                'payment_method' => 'stripe',
                'gateway_payment_id' => $paymentIntent->id,
                'status' => 'pending',
                'amount' => $amount,
                'currency' => 'USD',
                'metadata' => [
                    'payment_intent_client_secret' => $paymentIntent->client_secret,
                ],
            ]);

            return response()->json([
                'success' => true,
                'client_secret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id,
                'subscription_id' => $subscription->id,
            ]);
        } catch (ApiErrorException $e) {
            Log::error('Stripe PaymentIntent creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Confirm payment after Stripe Elements confirmation.
     */
    public function confirmPayment(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
            'subscription_id' => 'required|integer|exists:subscriptions,id',
        ]);

        $user = $request->user();
        $paymentIntentId = $request->payment_intent_id;
        $subscriptionId = $request->subscription_id;

        try {
            // Retrieve PaymentIntent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            // Verify the payment intent belongs to the user
            $subscription = Subscription::where('id', $subscriptionId)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $payment = Payment::where('gateway_payment_id', $paymentIntentId)
                ->where('subscription_id', $subscriptionId)
                ->firstOrFail();

            if ($paymentIntent->status === 'succeeded') {
                // Update payment status
                $payment->update([
                    'status' => 'completed',
                    'metadata' => array_merge($payment->metadata ?? [], [
                        'stripe_response' => $paymentIntent->toArray(),
                    ]),
                ]);

                // Calculate subscription dates
                $startsAt = now();
                $endsAt = null;

                if ($subscription->type === 'premium_monthly') {
                    $endsAt = $startsAt->copy()->addMonth();
                } elseif ($subscription->type === 'premium_yearly') {
                    $endsAt = $startsAt->copy()->addYear();
                } else {
                    // Signature packages don't expire
                    $endsAt = null;
                }

                // Update subscription status
                $subscription->update([
                    'status' => 'active',
                    'payment_gateway_id' => $paymentIntent->id,
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Payment confirmed successfully',
                    'subscription' => $subscription->fresh(),
                ]);
            } else {
                // Payment failed
                $payment->update([
                    'status' => 'failed',
                ]);

                $subscription->update([
                    'status' => 'cancelled',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Payment failed. Please try again.',
                    'status' => $paymentIntent->status,
                ], 400);
            }
        } catch (ApiErrorException $e) {
            Log::error('Stripe payment confirmation failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm payment. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Handle Stripe webhooks.
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        if (!$webhookSecret) {
            Log::warning('Stripe webhook secret not configured');
            return response()->json(['error' => 'Webhook secret not configured'], 500);
        }

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $sigHeader,
                $webhookSecret
            );
        } catch (\Exception $e) {
            Log::error('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // Handle the event
        switch ($event->type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($event->data->object);
                break;

            case 'payment_intent.payment_failed':
                $this->handlePaymentIntentFailed($event->data->object);
                break;

            default:
                Log::info('Unhandled Stripe webhook event', [
                    'type' => $event->type,
                ]);
        }

        return response()->json(['received' => true]);
    }

    /**
     * Handle successful payment intent.
     */
    protected function handlePaymentIntentSucceeded($paymentIntent)
    {
        $payment = Payment::where('gateway_payment_id', $paymentIntent->id)->first();

        if ($payment && $payment->status !== 'completed') {
            $payment->update([
                'status' => 'completed',
                'metadata' => array_merge($payment->metadata ?? [], [
                    'webhook_data' => $paymentIntent->toArray(),
                ]),
            ]);

            $subscription = $payment->subscription;
            if ($subscription && $subscription->status === 'pending') {
                $startsAt = now();
                $endsAt = null;

                if ($subscription->type === 'premium_monthly') {
                    $endsAt = $startsAt->copy()->addMonth();
                } elseif ($subscription->type === 'premium_yearly') {
                    $endsAt = $startsAt->copy()->addYear();
                }

                $subscription->update([
                    'status' => 'active',
                    'payment_gateway_id' => $paymentIntent->id,
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                ]);
            }
        }
    }

    /**
     * Handle failed payment intent.
     */
    protected function handlePaymentIntentFailed($paymentIntent)
    {
        $payment = Payment::where('gateway_payment_id', $paymentIntent->id)->first();

        if ($payment) {
            $payment->update([
                'status' => 'failed',
                'metadata' => array_merge($payment->metadata ?? [], [
                    'webhook_data' => $paymentIntent->toArray(),
                ]),
            ]);

            $subscription = $payment->subscription;
            if ($subscription) {
                $subscription->update([
                    'status' => 'cancelled',
                ]);
            }
        }
    }
}
