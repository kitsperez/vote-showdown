<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('polls', 'visits_count')) {
            Schema::table('polls', function (Blueprint $table) {
                $table->unsignedInteger('visits_count')->default(0)->after('uuid');
            });
        }

        if (! Schema::hasTable('poll_visits')) {
            Schema::create('poll_visits', function (Blueprint $table) {
                $table->id();
                $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('ip_hash', 64)->nullable();   // salted hash only — never the raw IP (R13)
                $table->string('user_agent')->nullable();
                $table->timestamp('visited_at')->index();
                $table->index(['poll_id', 'visited_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_visits');

        Schema::table('polls', function (Blueprint $table) {
            $table->dropColumn('visits_count');
        });
    }
};
