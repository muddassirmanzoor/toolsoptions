<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained()->onDelete('set null');
            $table->string('payment_method'); // 'stripe', 'paypal'
            $table->string('gateway_payment_id'); // Stripe payment_intent_id or PayPal order_id
            $table->string('status')->default('pending'); // 'pending', 'completed', 'failed', 'refunded'
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->json('metadata')->nullable(); // Store additional payment data
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index('gateway_payment_id');
            $table->index('subscription_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
