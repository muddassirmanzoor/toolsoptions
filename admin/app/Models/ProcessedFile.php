<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProcessedFile extends Model
{
    protected $fillable = [
        'user_id',
        'tool_name',
        'file_count',
        'status',
        'file_path',
        'original_filename',
        'metadata',
        'processed_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'processed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the processed file.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get formatted date for display.
     */
    public function getFormattedDateAttribute(): string
    {
        return $this->created_at->format('M d, Y');
    }

    /**
     * Get formatted date with time for display (matches iLovePDF format).
     */
    public function getFormattedDateTimeAttribute(): string
    {
        return $this->created_at->format('M d, Y, g:i:s A');
    }
}
