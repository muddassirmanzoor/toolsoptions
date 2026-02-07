<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SignatureReceiver extends Model
{
    protected $fillable = [
        'signature_request_id',
        'name',
        'email',
        'role',
        'order',
        'status',
        'last_action_at',
        'last_reminder_at',
        'signed_at',
        'token',
    ];

    protected $casts = [
        'last_action_at' => 'datetime',
        'last_reminder_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function signatureRequest(): BelongsTo
    {
        return $this->belongsTo(SignatureRequest::class);
    }

    public function getFormattedLastActionAtAttribute(): ?string
    {
        return $this->last_action_at?->format('M d, Y, g:i:s A');
    }
}
