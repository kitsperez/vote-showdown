# Module · Admin Controls (Showrunner)

> Vertical slice. Part of the [source of truth](../README.md). Cross-refs: auth [`../06-auth-and-roles.md`](../06-auth-and-roles.md), backend [`../04-backend.md`](../04-backend.md), real-time [`../07-realtime.md`](../07-realtime.md).

## Responsibility

Run-time control of a live show, **admin-only**. Ports the prototype's `handleClosePoll`, `handleRestartPoll`, `handleAddSeconds`, the voter log, and the settings/reset actions — replacing every `alert()` and client-only state mutation with server actions + broadcasts.

## Capabilities

| Action | Prototype origin | Effect |
|---|---|---|
| **Close now** | `handleClosePoll` | `status=ended`, `ends_at=now`; broadcast `PollStatusChanged`; screens flip to results |
| **Add time** | `handleAddSeconds` | `ends_at += {30,60}s`; re-broadcast timer |
| **Restart / new round** | `handleRestartPoll` | delete this poll's votes, `status=active`, fresh `ends_at`; broadcast |
| **Voter log / audit** | voters tab in `App.tsx` | paginated table of votes (user, choice, time) |
| **Reset app state** | settings tab in `App.tsx` | re-seed to defaults — **dev/staging only**, guarded |

## Authorization

- Route group `polls/{poll}/control/*` behind `auth` + `role:admin` middleware ([`../06-auth-and-roles.md`](../06-auth-and-roles.md)) **and** `PollPolicy@control`.
- Creators do **not** get these; the frontend hides the controls by reading `auth.user.role`, but the server is the enforcer.

## Backend

- `Admin\ShowControlController` → `close` / `addSeconds` / `restart`, each delegating to `PollService` (see [`../04-backend.md`](../04-backend.md)) and returning `back()->with('success', …)`.
- `addSeconds` validates `seconds` ∈ {30, 60}.
- `restart` deletes votes in a transaction before re-activating (so the tally truly resets, unlike the prototype which just zeroed an in-memory count).

### Scheduled auto-end `[new]`

Server-authoritative expiry needs a sweeper so polls end even with no further traffic:

```php
// routes/console.php (or a command) — runs via `php artisan schedule:work`
Schedule::call(function () {
    Poll::where('status', PollStatus::Active)
        ->whereNotNull('ends_at')->where('ends_at', '<=', now())
        ->each(fn (Poll $p) => app(PollService::class)->close($p));
})->everyMinute();
```

Each auto-close broadcasts `PollStatusChanged`, flipping connected screens to results. (Referenced from [`../07-realtime.md`](../07-realtime.md).)

## Frontend

- Control buttons live in `ShowrunnerLayout`/`AdminDashboard`, rendered only for admins. Each is an Inertia `router.post(route('polls.control.close', poll.id))` etc. — no `alert()`; success surfaces through the `flash`→`Toast` path.
- `pages/Admin/Voters.tsx` — the audit table (ported from the inlined voters tab), now paginated from the server.

## Acceptance criteria

- [ ] Only admins can close / add time / restart; creators & invitees get 403 and don't see the controls.
- [ ] Close, add-time, and restart each broadcast `PollStatusChanged`; other clients react live.
- [ ] Restart removes prior votes (tally returns to zero) within a transaction.
- [ ] Scheduled sweeper auto-ends expired active polls and broadcasts the change.
- [ ] "Reset app state" is unavailable in production.
- [ ] No `alert()` calls remain anywhere.
