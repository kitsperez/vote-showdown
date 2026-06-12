<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->foreignId('poll_option_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            // Hard dedupe for multiple-choice; single-choice additionally guarded by a
            // per-user-per-poll Cache::lock in VoteService (risk R2).
            $table->unique(['poll_id', 'poll_option_id', 'user_id']);
            $table->index(['poll_id', 'poll_option_id']);   // fast tally
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
