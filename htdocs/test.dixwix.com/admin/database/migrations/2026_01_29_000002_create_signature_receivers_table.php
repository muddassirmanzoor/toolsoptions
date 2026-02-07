<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('signature_receivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('signature_request_id')->constrained('signature_requests')->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('role', 32)->default('signer'); // signer, validator, witness
            $table->unsignedTinyInteger('order')->default(0);
            $table->string('status', 32)->default('pending'); // pending, sent, signed, declined
            $table->timestamp('last_action_at')->nullable();
            $table->string('signed_at')->nullable();
            $table->string('token', 64)->nullable()->unique()->comment('Token for signing link');
            $table->timestamps();

            $table->index(['signature_request_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signature_receivers');
    }
};
