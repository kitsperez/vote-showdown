# 07 - Real-time (Laravel Reverb + Echo)

> Part of the [Vote Showdown source of truth](README.md).

## Responsibility

Realtime replaces the prototype simulator with server-authored events:

- Vote tally snapshots.
- Recent-voter ticker entries.
- Poll status/timer changes.

Persistence must not depend on successful broadcasting. Votes and poll changes remain valid even if Reverb is unavailable.

## Current Events

| Event | Broadcast name | Payload | Channels |
|---|---|---|---|
| `VoteCast` | `.vote.cast` | `pollId`, `tally` | private `poll.{id}`, public `poll.{id}` |
| `VoterTicked` | `.voter.ticked` | `pollId`, `voter` | private `poll.{id}`, public `poll.{id}` |
| `PollStatusChanged` | `.poll.status` | `pollId`, `status`, `endsAt`, `remainingSeconds` | private `poll.{id}`, public `poll.{id}` |

## Channels

Private channel:

- Defined in `routes/channels.php`.
- Any authenticated user may listen to `poll.{poll}` in the current public-showdown model.

Public channel:

- Events also fan out to public `poll.{id}` channels for no-login guest/results pages.
- If private/invite-only polls become a requirement, this must be redesigned with public route access at the same time.

## Frontend Hooks

- `use-poll-channel.ts` listens to authenticated/private poll events.
- `use-public-poll-channel.ts` listens to public poll events.
- `use-countdown.ts` renders local countdown display from server `endsAt`.

## Broadcast Behavior

Vote flow:

```text
VoteService::cast
  -> write vote row
  -> derive tally
  -> broadcast VoterTicked to others
  -> coalesce VoteCast to at most roughly 4/s per poll
```

Status flow:

```text
PollService::launch/close/addSeconds/restart/scheduled-expiry
  -> persist status/ends_at
  -> dispatch PollStatusChanged
```

## Server-Authoritative Timer

`polls.ends_at` is the source of truth. The frontend countdown is display-only. Expiry is enforced by:

- `Poll::hasExpired()`.
- `PollService::settleIfExpired()` on reads.
- Scheduled auto-end in `routes/console.php`.
- Vote rejection when the poll is not active or has expired.

## Current Verification Gaps

- [ ] Verify socket-id forwarding / `toOthers()` behavior in browser so the acting voter does not see duplicate movement.
- [ ] Run authenticated two-browser live vote test.
- [ ] Run public guest/results two-browser live vote test.
- [ ] Kill Reverb and confirm degraded behavior is acceptable.
- [ ] Run burst/load test and tune coalescing window.
- [ ] Confirm production Redis is used for locks/coalescing/queue in deployment.
