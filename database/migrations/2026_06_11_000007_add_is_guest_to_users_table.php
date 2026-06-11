<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'is_guest')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_guest')->default(false)->index()->after('is_demo');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'is_guest')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex(['is_guest']);
                $table->dropColumn('is_guest');
            });
        }
    }
};
