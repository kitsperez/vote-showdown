<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Voters no longer become user accounts. A single canonical `voter_key` identifies any
 * voter (`user:{id}` authed, `email:{email}` or `token:{token}` guest); the dedupe unique
 * index moves from user_id onto voter_key. Existing is_guest accounts are migrated onto the
 * votes and then purged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('votes', function (Blueprint $table) {
            $table->string('voter_key', 191)->nullable()->after('user_id');
            $table->string('voter_email', 160)->nullable()->after('voter_key');
            $table->string('voter_name', 80)->nullable()->after('voter_email');
            $table->string('voter_token', 64)->nullable()->after('voter_name');
        });

        // user_id becomes optional — guest votes won't reference a users row.
        Schema::table('votes', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
        });

        // Backfill guest votes (portable, no DB-specific JOIN UPDATE): copy email/name onto
        // the vote, key by email, drop the user link.
        DB::table('users')->where('is_guest', true)->orderBy('id')->chunkById(200, function ($guests) {
            foreach ($guests as $guest) {
                DB::table('votes')->where('user_id', $guest->id)->update([
                    'voter_email' => $guest->email,
                    'voter_name' => $guest->name,
                    'voter_key' => 'email:'.strtolower($guest->email),
                    'user_id' => null,
                ]);
            }
        });

        // Backfill remaining (real authenticated user) votes.
        DB::table('votes')->whereNull('voter_key')->whereNotNull('user_id')->orderBy('id')->chunkById(500, function ($votes) {
            foreach ($votes as $vote) {
                DB::table('votes')->where('id', $vote->id)->update(['voter_key' => 'user:'.$vote->user_id]);
            }
        });

        // Swap the dedupe unique index onto voter_key.
        Schema::table('votes', function (Blueprint $table) {
            $table->dropUnique(['poll_id', 'poll_option_id', 'user_id']);
            $table->string('voter_key', 191)->nullable(false)->change();
            $table->unique(['poll_id', 'poll_option_id', 'voter_key']);
        });

        // Guest votes are now self-contained — purge the claimable accounts they came from.
        DB::table('users')->where('is_guest', true)->delete();
    }

    public function down(): void
    {
        Schema::table('votes', function (Blueprint $table) {
            $table->dropUnique(['poll_id', 'poll_option_id', 'voter_key']);
            $table->dropColumn(['voter_key', 'voter_email', 'voter_name', 'voter_token']);
        });

        // Note: purged guest accounts and their vote links are not restored on rollback.
        Schema::table('votes', function (Blueprint $table) {
            $table->unique(['poll_id', 'poll_option_id', 'user_id']);
        });
    }
};
