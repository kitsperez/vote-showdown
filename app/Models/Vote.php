<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vote extends Model
{
    /** @use HasFactory<\Database\Factories\VoteFactory> */
    use HasFactory;

    protected $fillable = [
        'poll_id',
        'poll_option_id',
        'user_id',
        'voter_key',
        'voter_email',
        'voter_name',
        'voter_token',
    ];

    /**
     * Backstop for factory/seed rows: derive voter_key from user_id when not set explicitly.
     * Real votes set it via VoterIdentity in VoteService.
     */
    protected static function booted(): void
    {
        static::creating(function (Vote $vote) {
            if (empty($vote->voter_key) && $vote->user_id) {
                $vote->voter_key = "user:{$vote->user_id}";
            }
        });
    }

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    public function option(): BelongsTo
    {
        return $this->belongsTo(PollOption::class, 'poll_option_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
