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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // 'premium_monthly', 'premium_yearly', 'signature_package'
            $table->string('status')->default('pending'); // 'pending', 'active', 'cancelled', 'expired'
            $table->string('payment_method'); // 'stripe', 'paypal'
            $table->string('payment_gateway_id')->nullable(); // Stripe subscription ID or PayPal subscription ID
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->integer('quantity')->default(1); // For signature packages
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->json('metadata')->nullable(); // Store additional subscription data
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index('payment_gateway_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
