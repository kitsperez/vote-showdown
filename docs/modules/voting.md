# Module · Voting

> Vertical slice. Part of the [source of truth](../README.md). Cross-refs: DB [`../03-database.md`](../03-database.md), backend [`../04-backend.md`](../04-backend.md), real-time [`../07-realtime.md`](../07-realtime.md).

## Responsibility

An **invitee** casts a vote on an active poll; the tally updates everywhere live. Ports the prototype's `InviteeView` and `handleCastVote`, but with real persistence, dedupe, and broadcasting — and with the fake simulator removed.

> **Entry point:** voters reach this screen by **scanning a QR code** (or following a share link) — see [qr-voting.md](qr-voting.md). The QR is the primary way an audience joins a live showdown.

## Rules

1. **Poll must be active.** `Poll::isActive()` (status `active` **and** not past `ends_at`). Expired/ended/draft → reject.
2. **Dedupe.**
   - Single-choice (`allow_multiple = false`): one vote per `(poll_id, user_id)`.
   - Multiple-choice (`allow_multiple = true`): one vote per `(poll_id, poll_option_id, user_id)` — i.e. can pick several distinct options, not the same one twice.
3. **Server is authoritative.** The client never sends a count. Tally = `COUNT(votes)` per option, recomputed and broadcast.
4. **Rate limited.** `throttle:votes` (e.g. 10/min/user) on the route.

Enforcement is layered: `VotePolicy@cast` (friendly rejection) → **atomic per-user-per-poll lock** in `VoteService` → DB `UNIQUE(poll_id, poll_option_id, user_id)` (multi-choice backstop).

> ⚠️ **Race-condition warning (risk R2).** The DB unique index alone does **not** make single-choice voting race-safe: two concurrent requests for *different* options both pass `VotePolicy@cast`'s `exists()` check (TOCTOU) and insert two rows — the unique index can't catch them because `poll_option_id` differs, so the user ends up with two votes. The policy check is not the enforcement point; an atomic lock is. Use `Cache::lock("vote:{poll}:{user}")` to serialize a user's votes within a poll. (A `lockForUpdate()` on a not-yet-existing row locks nothing — do not rely on it.)

## Data touched

`votes` (insert), read `poll_options` + `votes` for tally. Schema & index rationale in [`../03-database.md`](../03-database.md).

## Backend

```php
// VoteService::cast — atomic lock serializes a user's votes within one poll (fixes R2)
public function cast(User $user, Poll $poll, int $optionId): Vote {
    return Cache::lock("vote:{$poll->id}:{$user->id}", 5)->block(3, function () use ($user, $poll, $optionId) {
        return DB::transaction(function () use ($user, $poll, $optionId) {
            $already = $poll->votes()->where('user_id', $user->id);
            if (! $poll->allow_multiple && $already->exists()) {
                throw ValidationException::withMessages(['vote' => 'You already voted.']);
            }
            if ($poll->allow_multiple && $already->clone()->where('poll_option_id', $optionId)->exists()) {
                throw ValidationException::withMessages(['vote' => 'You already picked that option.']);
            }
            $vote = $poll->votes()->create(['poll_option_id' => $optionId, 'user_id' => $user->id]);

            $tally = $this->tally($poll->fresh('options'));
            $voter = ['name' => $user->name, 'avatarText' => $user->avatar_text, 'avatarBgColor' => $user->avatar_bg_color,
                      'votedOptionLabel' => $poll->options->firstWhere('id', $optionId)?->label, 'votedAt' => now()->diffForHumans()];
            $this->broadcastTally($poll, $tally, $voter);   // coalesced — see 07-realtime.md (R1)
            return $vote;
        });
    });
}

// VoteService::tally
public function tally(Poll $poll): array {
    return $poll->options()->withCount('votes')->orderBy('position')->get()
        ->map(fn ($o) => ['poll_option_id' => $o->id, 'label' => $o->label, 'count' => $o->votes_count])->all();
}
```

- `broadcastTally()` uses `->toOthers()` so the acting user doesn't get a duplicate of their own event (they already see the result from the Inertia redirect). **This requires Echo's socket id to be forwarded on Inertia requests** — see [`../07-realtime.md`](../07-realtime.md) (R3). It is also **coalesced** so a hot poll doesn't fire one broadcast per vote (R1).
- Controller: `VoteController@store` authorizes (`$this->authorize('cast', [$poll, $request->poll_option_id])`), calls the service, returns `back()->with('success', 'Vote cast! ⚡')`. Inertia partial-reloads `poll`/`voters` props.

## Frontend

- `pages/Vote.tsx` — ports `InviteeView`; renders options as the brutalist choice cards. `useForm({ poll_option_id }).post(route('polls.votes.store', poll.id))`. After voting, show "you voted" state (`hasVoted` prop) and the live tally.
- `pages/Polls/Show.tsx` — uses `usePollChannel` to apply incoming `VoteCast` payloads: **replace** tally with `e.tally` (idempotent — see the double-count guard in [`../07-realtime.md`](../07-realtime.md)) and prepend `e.voter` to the ticker.

## Acceptance criteria

- [ ] Invitee can vote once on an active poll; tally increments for all connected clients.
- [ ] Second vote on a single-choice poll is rejected, **even under concurrent requests for different options** (the `Cache::lock` serializes; the policy check alone is insufficient — see R2).
- [ ] Voting a `draft`/`ended`/expired poll is rejected.
- [ ] Multiple-choice poll: same option twice rejected; different options allowed.
- [ ] Acting voter does not see their own vote counted twice.
- [ ] Rate limiter blocks vote floods.
