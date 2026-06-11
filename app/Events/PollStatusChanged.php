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
 * Fired on launch / close / restart / add-time so connected screens flip views and
 * resync their server-authoritative countdown.
 */
class PollStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Poll $poll,
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("poll.{$this->poll->id}");
    }

    public function broadcastAs(): string
    {
        return 'poll.status';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'pollId' => $this->poll->id,
            'status' => $this->poll->status->value,
            'endsAt' => $this->poll->ends_at?->toIso8601String(),
            'remainingSeconds' => $this->poll->remainingSeconds(),
        ];
    }
}
