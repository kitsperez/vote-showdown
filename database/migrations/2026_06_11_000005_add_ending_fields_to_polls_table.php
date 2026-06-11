<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('polls', function (Blueprint $table) {
            if (! Schema::hasColumn('polls', 'end_mode')) {
                $table->enum('end_mode', ['duration', 'deadline'])->default('duration')->after('access_password');
            }

            if (! Schema::hasColumn('polls', 'duration_seconds')) {
                $table->unsignedInteger('duration_seconds')->nullable()->after('end_mode');
            }

            if (! Schema::hasColumn('polls', 'deadline_at')) {
                $table->timestamp('deadline_at')->nullable()->after('duration_seconds');
            }

            if (! Schema::hasColumn('polls', 'starts_at')) {
                $table->timestamp('starts_at')->nullable()->after('deadline_at');
            }

            if (! Schema::hasColumn('polls', 'ends_at')) {
                $table->timestamp('ends_at')->nullable()->index()->after('starts_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('polls', function (Blueprint $table) {
            if (Schema::hasColumn('polls', 'ends_at')) {
                $table->dropIndex(['ends_at']);
                $table->dropColumn('ends_at');
            }

            if (Schema::hasColumn('polls', 'starts_at')) {
                $table->dropColumn('starts_at');
            }

            if (Schema::hasColumn('polls', 'deadline_at')) {
                $table->dropColumn('deadline_at');
            }

            if (Schema::hasColumn('polls', 'duration_seconds')) {
                $table->dropColumn('duration_seconds');
            }

            if (Schema::hasColumn('polls', 'end_mode')) {
                $table->dropColumn('end_mode');
            }
        });
    }
};
