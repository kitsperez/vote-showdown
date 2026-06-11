<?php

namespace App\Events;

use App\Models\Poll;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Authoritative tally snapshot for a poll. Coalesced (risk R1) — see VoteService::broadcastTally.
 */
class VoteCast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<int, array{poll_option_id:int, label:string, count:int}>  $tally
     */
    public function __construct(
        public Poll $poll,
        public array $tally,
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("poll.{$this->poll->id}");
    }

    public function broadcastAs(): string
    {
        return 'vote.cast';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'pollId' => $this->poll->id,
            'tally' => $this->tally,
        ];
    }
}
