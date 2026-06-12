<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('polls', 'access_password')) {
            Schema::table('polls', function (Blueprint $table) {
                $table->string('access_password')->nullable()->after('allow_multiple');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('polls', 'access_password')) {
            Schema::table('polls', function (Blueprint $table) {
                $table->dropColumn('access_password');
            });
        }
    }
};
