<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'subscription_id',
        'payment_method',
        'gateway_payment_id',
        'status',
        'amount',
        'currency',
        'metadata',
        'hidden_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'hidden_at' => 'datetime',
    ];

    public function scopeVisible($query)
    {
        return $query->whereNull('hidden_at');
    }

    /**
     * Get the user that owns the payment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subscription that owns the payment.
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * Check if payment is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Human-readable invoice details from subscription (Premium Plan, Signature Package, etc.).
     */
    public function getInvoiceDetailsAttribute(): string
    {
        $sub = $this->subscription;
        if (!$sub) {
            return 'Payment';
        }
        $type = $sub->type;
        $qty = (int) ($sub->quantity ?? 1);
        if ($type === 'premium_monthly') {
            return 'Premium Plan (Monthly)';
        }
        if ($type === 'premium_yearly') {
            return 'Premium Plan (Yearly)';
        }
        if ($type === 'signature_package') {
            return 'Signature Package (' . $qty . ' signatures)';
        }
        return 'Payment';
    }
}
