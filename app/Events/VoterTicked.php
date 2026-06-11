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
 * Cheap per-vote ticker blip for the recent-voters feed (not coalesced).
 */
class VoterTicked implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array{name:string, avatarText:string, avatarBgColor:string, votedOptionLabel:?string, votedAt:string}  $voter
     */
    public function __construct(
        public Poll $poll,
        public array $voter,
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("poll.{$this->poll->id}");
    }

    public function broadcastAs(): string
    {
        return 'voter.ticked';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'pollId' => $this->poll->id,
            'voter' => $this->voter,
        ];
    }
}
