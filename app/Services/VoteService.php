<?php

namespace App\Services;

use App\Events\VoteCast;
use App\Events\VoterTicked;
use App\Models\Poll;
use App\Models\Vote;
use App\Support\VoterIdentity;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoteService
{
    /**
     * Cast a vote for any voter (authed user or guest). An atomic per-voter-per-poll lock
     * serializes a voter's votes within a poll, closing the single-choice TOCTOU race the
     * unique index cannot catch (risk R2). Voters are identified by VoterIdentity::key, not
     * a users row.
     */
    public function cast(VoterIdentity $voter, Poll $poll, int $optionId): Vote
    {
        $lockKey = 'vote:'.$poll->id.':'.md5($voter->key);

        return Cache::lock($lockKey, 5)->block(3, function () use ($voter, $poll, $optionId) {
            return DB::transaction(function () use ($voter, $poll, $optionId) {
                $already = $poll->votes()->where('voter_key', $voter->key);

                if (! $poll->allow_multiple && $already->exists()) {
                    throw ValidationException::withMessages(['vote' => 'You already voted in this showdown.']);
                }

                if ($poll->allow_multiple && (clone $already)->where('poll_option_id', $optionId)->exists()) {
                    throw ValidationException::withMessages(['vote' => 'You already picked that option.']);
                }

                $vote = $poll->votes()->create([
                    'poll_option_id' => $optionId,
                    'user_id' => $voter->userId,
                    'voter_key' => $voter->key,
                    'voter_email' => $voter->email,
                    'voter_name' => $voter->name,
                    'voter_token' => $voter->token,
                ]);

                $poll->load('options');
                $option = $poll->options->firstWhere('id', $optionId);

                $this->broadcastTally($poll, $this->tally($poll), [
                    'name' => $voter->displayName,
                    'avatarText' => $voter->avatarText,
                    'avatarBgColor' => $voter->avatarBgColor,
                    'votedOptionLabel' => $option?->label,
                    'votedAt' => now()->diffForHumans(),
                ]);

                return $vote;
            });
        });
    }

    /**
     * Admin moderation (D18): remove all of a voter's votes on a poll, then rebroadcast the
     * derived tally so live viewers update. Voters are identified by voter_key. Returns the
     * number of votes removed.
     */
    public function deleteForVoterKey(Poll $poll, string $voterKey): int
    {
        $deleted = DB::transaction(fn () => $poll->votes()->where('voter_key', $voterKey)->delete());

        if ($deleted > 0) {
            try {
                broadcast(new VoteCast($poll->load('options'), $this->tally($poll)));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return $deleted;
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
        // A down/unreachable Reverb must never break a vote — log and move on.
        try {
            broadcast(new VoterTicked($poll, $voter))->toOthers();

            // Cache::add is atomic: only the first caller within the window dispatches a tally.
            if (Cache::add("tally-bcast:{$poll->id}", 1, now()->addMilliseconds(250))) {
                broadcast(new VoteCast($poll, $tally))->toOthers();
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
