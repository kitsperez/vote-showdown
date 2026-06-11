<?php

namespace App\Services;

use App\Events\VoteCast;
use App\Events\VoterTicked;
use App\Models\Poll;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoteService
{
    /**
     * Cast a vote. An atomic per-user-per-poll lock serializes a user's votes within a
     * poll, closing the single-choice TOCTOU race the unique index cannot catch (risk R2).
     */
    public function cast(User $user, Poll $poll, int $optionId): Vote
    {
        return Cache::lock("vote:{$poll->id}:{$user->id}", 5)->block(3, function () use ($user, $poll, $optionId) {
            return DB::transaction(function () use ($user, $poll, $optionId) {
                $already = $poll->votes()->where('user_id', $user->id);

                if (! $poll->allow_multiple && $already->exists()) {
                    throw ValidationException::withMessages(['vote' => 'You already voted in this showdown.']);
                }

                if ($poll->allow_multiple && (clone $already)->where('poll_option_id', $optionId)->exists()) {
                    throw ValidationException::withMessages(['vote' => 'You already picked that option.']);
                }

                $vote = $poll->votes()->create([
                    'poll_option_id' => $optionId,
                    'user_id' => $user->id,
                ]);

                $poll->load('options');
                $option = $poll->options->firstWhere('id', $optionId);

                $this->broadcastTally($poll, $this->tally($poll), [
                    'name' => $user->name,
                    'avatarText' => $user->avatar_text ?? strtoupper(substr($user->name, 0, 2)),
                    'avatarBgColor' => $user->avatar_bg_color ?? 'bg-[#9cf0ff]',
                    'votedOptionLabel' => $option?->label,
                    'votedAt' => now()->diffForHumans(),
                ]);

                return $vote;
            });
        });
    }

    /**
     * Derived tally — counts come from the votes table, never a client.
     *
     * @return array<int, array{poll_option_id:int, label:string, count:int}>
     */
    public function tally(Poll $poll): array
    {
        return $poll->options()
            ->withCount('votes')
            ->orderBy('position')
            ->get()
            ->map(fn ($option) => [
                'poll_option_id' => $option->id,
                'label' => $option->label,
                'count' => $option->votes_count,
            ])
            ->all();
    }

    /**
     * Ticker per vote (cheap), tally coalesced to <=4/s per poll (risk R1).
     * VoteCast carries the full snapshot, so dropping intermediate broadcasts is safe.
     *
     * @param  array<int, array{poll_option_id:int, label:string, count:int}>  $tally
     * @param  array<string, mixed>  $voter
     */
    protected function broadcastTally(Poll $poll, array $tally, array $voter): void
    {
        broadcast(new VoterTicked($poll, $voter))->toOthers();

        // Cache::add is atomic: only the first caller within the window dispatches a tally.
        if (Cache::add("tally-bcast:{$poll->id}", 1, now()->addMilliseconds(250))) {
            broadcast(new VoteCast($poll, $tally))->toOthers();
        }
    }
}
