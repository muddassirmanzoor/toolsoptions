<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SignatureEvent extends Model
{
    protected $fillable = [
        'signature_request_id',
        'role',
        'who',
        'event',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function signatureRequest(): BelongsTo
    {
        return $this->belongsTo(SignatureRequest::class);
    }

    public function getFormattedDateTimeAttribute(): string
    {
        return $this->created_at->format('M d, Y, g:i:s A') . ' UTC';
    }
}
