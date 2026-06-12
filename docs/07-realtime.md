# 07 · Real-time (Laravel Reverb + Echo)

> Part of the [Vote Showdown source of truth](README.md). Decision: **Reverb + Echo** ([`01-overview.md`](01-overview.md)). This is what makes the "showdown" live.

Real-time replaces the prototype's fake `setInterval` vote simulator (`App.tsx`) with genuine broadcasts: when *anyone* votes or an admin changes a poll's state, *every* connected screen updates within milliseconds.

## Topology

```
User A votes ──HTTP POST──▶ Laravel ──▶ VoteService::cast ──▶ broadcast(VoteCast)
                                                                     │
                                          queue worker ──────────────┘
                                                 │
                                                 ▼
                                          Reverb (WS server)
                                                 │  push to channel poll.{id}
                          ┌──────────────────────┼──────────────────────┐
                          ▼                       ▼                       ▼
                     User B (Echo)          User C (Echo)          Admin (Echo)
                  tally + ticker update   tally update          metrics update
```

The acting user (A) gets their own confirmation via Inertia's redirect/partial reload; *other* users (B, C, …) get it via Reverb. Don't double-apply A's vote — see the client guard below.

## Events `[new]`

All implement `ShouldBroadcast` and run on the queue. **Tally and ticker are split into two events** so the per-vote ticker stays live while the heavier tally is coalesced (see Broadcast coalescing / R1 below).

```php
// app/Events/VoteCast.php — authoritative tally snapshot (coalesced)
class VoteCast implements ShouldBroadcast {
    public function __construct(public Poll $poll, public array $tally) {}
    public function broadcastOn(): Channel { return new PrivateChannel("poll.{$this->poll->id}"); }
    public function broadcastAs(): string { return 'vote.cast'; }
    public function broadcastWith(): array {
        return ['pollId' => $this->poll->id, 'tally' => $this->tally];
    }
}

// app/Events/VoterTicked.php — cheap per-vote ticker blip (not coalesced)
class VoterTicked implements ShouldBroadcast {
    public function __construct(public Poll $poll, public array $voter) {}
    public function broadcastOn(): Channel { return new PrivateChannel("poll.{$this->poll->id}"); }
    public function broadcastAs(): string { return 'voter.ticked'; }
    public function broadcastWith(): array {
        return ['pollId' => $this->poll->id, 'voter' => $this->voter];
    }
}

// app/Events/PollStatusChanged.php  → fired by launch/close/restart/addSeconds
class PollStatusChanged implements ShouldBroadcast {
    public function __construct(public Poll $poll) {}
    public function broadcastOn(): Channel { return new PrivateChannel("poll.{$this->poll->id}"); }
    public function broadcastAs(): string { return 'poll.status'; }
    public function broadcastWith(): array {
        return ['pollId' => $this->poll->id, 'status' => $this->poll->status->value, 'endsAt' => $this->poll->ends_at?->toIso8601String(), 'remainingSeconds' => $this->poll->remainingSeconds()];
    }
}
```

- `tally` is the authoritative array from `VoteService::tally()` (`[{poll_option_id, label, count}]`) — clients render these numbers rather than incrementing locally, so everyone converges on the same totals.
- `voter` is the minimal display payload for the ticker (`name`, `avatarText`, `avatarBgColor`, `votedOptionLabel`).

## Dual private + public channels (guest live updates) `[new]`

Each event's `broadcastOn()` returns **both** a `PrivateChannel("poll.{id}")` and a `Channel("poll.{id}")`. The authed page subscribes to the private channel (`echo().private`); the **no-login guest & results pages** subscribe to the public channel (`echo().channel`, hook `use-public-poll-channel.ts`) so they get the same live stream without `/broadcasting/auth`. This powers the `/r/{poll}` projection page: voters prepend live and a floating **+1** pops on the voted option per `VoterTicked` (no refresh). `->toOthers()` still excludes only the acting voter's own client, so spectators always receive.

## Channel authorization `[new]`

```php
// routes/channels.php — private channel, any authenticated user who can see the poll
Broadcast::channel('poll.{poll}', function (User $user, Poll $poll) {
    return $user !== null; // tighten if polls become private/invite-only
});
```

## Server config `[infra]`

```env
BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database          # or redis in prod

REVERB_APP_ID=...
REVERB_APP_KEY=...
REVERB_APP_SECRET=...
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http

# Exposed to Vite/Echo (must be VITE_ prefixed)
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

Install: `php artisan install:broadcasting` (wires Reverb + Echo scaffolding), then run `php artisan reverb:start` and a `php artisan queue:work` alongside Vite and the app server (the `composer dev` orchestrator from [`02-architecture.md`](02-architecture.md)).

## Echo client `[infra]`

```ts
// resources/js/bootstrap.ts
import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
window.axios = axios;
window.Pusher = Pusher;
window.Echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
});
```

### Socket-id forwarding — required for `->toOthers()` (risk R3) `[infra]`

`broadcast(...)->toOthers()` only excludes the sender if the request carries Echo's socket id in the `X-Socket-Id` header. Inertia/axios requests don't send it by default, so **the acting voter would receive their own broadcast and (without the idempotent-replace guard below) double-count**. Forward it once at bootstrap:

```ts
// resources/js/bootstrap.ts (after Echo init)
window.axios.interceptors.request.use((config) => {
  const id = window.Echo.socketId();
  if (id) config.headers['X-Socket-Id'] = id;
  return config;
});
```

> Inertia's router uses this axios instance, so all visits/POSTs inherit the header. Verify in Phase 4 that an acting voter's tally moves exactly once.

## Subscription hook `[new]`

```ts
// resources/js/hooks/usePollChannel.ts
export function usePollChannel(pollId, { onVote, onStatus }) {
  useEffect(() => {
    const ch = window.Echo.private(`poll.${pollId}`)
      .listen('.vote.cast', (e) => onTally(e.tally))     // coalesced authoritative tally
      .listen('.voter.ticked', (e) => onTicker(e.voter)) // per-vote ticker blip
      .listen('.poll.status', (e) => onStatus(e));
    return () => window.Echo.leave(`poll.${pollId}`);
  }, [pollId]);
}
```

Used by `pages/Polls/Show.tsx` and the admin dashboard to live-update the tally race, the recent-voters ticker, and the status/countdown — the real versions of the prototype's `recentVotesTickerText`, `votingVelocity`, and `engagementRate`.

## Broadcast coalescing — survive a hot poll (risk R1) `[new]`

A "high-energy showdown" can produce hundreds of votes/minute. One `VoteCast` per vote × N connected clients is a fan-out cliff that can saturate Reverb and the browser. **Do not broadcast the full tally on every vote.** Split the two payloads by cost:

- **Ticker entry (cheap, per-vote OK):** the `voter` blip can broadcast per vote (small, append-only).
- **Tally (expensive, coalesce):** throttle authoritative tally broadcasts to **≤ ~4/sec per poll**. Implement `VoteService::broadcastTally()` to debounce via a cache timestamp — only dispatch a tally broadcast if `now - last >= 250ms` for that poll; otherwise schedule a single trailing-edge job so the final numbers always land.

```php
// VoteService::broadcastTally (sketch)
protected function broadcastTally(Poll $poll, array $tally, array $voter): void {
    broadcast(new VoterTicked($poll, $voter))->toOthers();          // per-vote, cheap
    $key = "tally-bcast:{$poll->id}";
    if (! Cache::add($key, 1, now()->addMilliseconds(250))) return; // a tally went out <250ms ago
    broadcast(new VoteCast($poll, $tally))->toOthers();             // coalesced authoritative tally
}
```

Tune the 250ms window in Phase 4 under a staging load test. Because `VoteCast` carries the **full** tally (not a delta), dropping intermediate broadcasts is safe — clients always converge on the latest snapshot.

## Server-authoritative timer

The countdown is **not** client-owned anymore:

1. `PollService::launch` sets `ends_at = now() + duration_seconds` and broadcasts `PollStatusChanged`.
2. Clients render remaining time with `useCountdown(endsAt)` (display ticking only).
3. When a vote arrives after `ends_at`, `VotePolicy::cast` rejects it (`Poll::isActive()` checks expiry) — no reliance on a client clock.
4. A scheduled command (`php artisan schedule:work`) sweeps expired-but-still-`active` polls, sets them `ended`, and broadcasts `PollStatusChanged`, so screens flip to results even with no further votes. (Document the command in [`modules/admin-controls.md`](modules/admin-controls.md).)

## Client guard against double-counting

The voter who triggered the POST already sees the new tally from Inertia's response. To avoid applying their own broadcast twice, `VoteCast` payloads carry the authoritative full `tally`; clients **replace** their tally with the payload rather than incrementing. This makes the operation idempotent regardless of event ordering — and is the safety net if socket-id forwarding (R3) ever fails.

## Degraded mode — Echo can't connect (risk R6) `[new]`

Reverb is a separate process; it can be down or unreachable (mobile networks, prod restart). The live view must not freeze:

- On Echo `connect` failure or `disconnected`, fall back to polling: `setInterval(() => router.reload({ only: ['poll', 'voters'] }), 3000)` from `usePollChannel`, cleared when the socket reconnects.
- In prod, Supervisor auto-restarts `reverb:start`; add a health check. The polling fallback keeps tallies advancing (higher latency) during any gap.
