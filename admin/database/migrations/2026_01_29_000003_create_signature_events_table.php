<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('signature_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('signature_request_id')->constrained('signature_requests')->cascadeOnDelete();
            $table->string('role', 32)->nullable(); // Requester, System, Signer
            $table->string('who')->nullable();
            $table->text('event');
            $table->timestamps();

            $table->index(['signature_request_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signature_events');
    }
};
