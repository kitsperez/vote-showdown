<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The "invitee" / Voter role is gone — voters are no longer user accounts (D19). Any
 * residual invitee row becomes a creator, and the column default drops to creator.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('role', 'invitee')->update(['role' => 'creator']);

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'creator'])->default('creator')->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'creator', 'invitee'])->default('invitee')->change();
        });
    }
};
