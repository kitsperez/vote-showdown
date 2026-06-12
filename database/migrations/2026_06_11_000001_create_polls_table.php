<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('polls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('allow_multiple')->default(false);
            $table->enum('status', ['draft', 'active', 'ended'])->default('draft')->index();

            // Optional access gate (D9). Null = open (vote anytime); set = hashed password.
            $table->string('access_password')->nullable();

            // End mode: a relative countdown OR an absolute deadline. Either resolves into
            // ends_at, the single server-authoritative end the rest of the app reads (D7).
            $table->enum('end_mode', ['duration', 'deadline'])->default('duration');
            $table->unsignedInteger('duration_seconds')->nullable();   // used when end_mode = duration
            $table->timestamp('deadline_at')->nullable();              // used when end_mode = deadline

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable()->index();   // resolved authoritative end
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('polls');
    }
};
