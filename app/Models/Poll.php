<?php

namespace App\Models;

use App\Enums\PollStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Poll extends Model
{
    /** @use HasFactory<\Database\Factories\PollFactory> */
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'title',
        'description',
        'allow_multiple',
        'status',
        'access_password',
        'end_mode',
        'duration_seconds',
        'deadline_at',
        'starts_at',
        'ends_at',
    ];

    /**
     * Never expose the access password hash across the Inertia boundary.
     *
     * @var list<string>
     */
    protected $hidden = [
        'access_password',
    ];

    protected function casts(): array
    {
        return [
            'allow_multiple' => 'boolean',
            'status' => PollStatus::class,
            'duration_seconds' => 'integer',
            'deadline_at' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(PollOption::class)->orderBy('position');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function isActive(): bool
    {
        return $this->status === PollStatus::Active && ! $this->hasExpired();
    }

    public function requiresPassword(): bool
    {
        return $this->access_password !== null;
    }

    /**
     * Has the current session cleared this poll's password gate? Always true when open.
     */
    public function isUnlocked(): bool
    {
        return ! $this->requiresPassword() || session()->get("poll_unlocked_{$this->id}", false) === true;
    }

    public function hasExpired(): bool
    {
        return $this->ends_at !== null && $this->ends_at->isPast();
    }

    /**
     * Display-only remaining seconds. The server (ends_at) is authoritative.
     * Carbon 3 note (risk R8): diffInSeconds returns a float and its sign semantics
     * changed, so guard with isFuture() rather than relying on a signed diff.
     */
    public function remainingSeconds(): int
    {
        return ($this->ends_at && $this->ends_at->isFuture())
            ? (int) round(now()->diffInSeconds($this->ends_at))
            : 0;
    }
}
