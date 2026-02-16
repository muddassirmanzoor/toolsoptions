<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SignatureRequest extends Model
{
    protected $fillable = [
        'user_id',
        'request_id',
        'document_name',
        'file_path',
        'signed_file_path',
        'status',
        'expires_at',
        'completed_at',
        'settings',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
        'settings' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function receivers(): HasMany
    {
        return $this->hasMany(SignatureReceiver::class)->orderBy('order');
    }

    public function events(): HasMany
    {
        return $this->hasMany(SignatureEvent::class)->orderBy('created_at');
    }

    public function getFormattedCreatedAtAttribute(): string
    {
        return $this->created_at->format('M d, Y, g:i:s A');
    }

    public function getFormattedExpiresAtAttribute(): ?string
    {
        return $this->expires_at?->format('m/d/Y');
    }
}
