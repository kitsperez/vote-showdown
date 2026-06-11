# Module · Dashboard & Analytics

> Vertical slice. Part of the [source of truth](../README.md). Cross-refs: real-time [`../07-realtime.md`](../07-realtime.md), frontend [`../05-frontend.md`](../05-frontend.md).

## Responsibility

The live oversight surface. Ports the prototype's `AdminDashboard` and `ResultsTally`:

- **Live tally race** — bars per option, sorted, updating in real time.
- **Recent-voters ticker** — scrolling list of who just voted.
- **Show metrics** — total voters, voting velocity, engagement rate, countdown.
- **Results view** — final standings when a poll ends (winner highlight).

The crucial change from the prototype: these numbers are **real**, derived from the database and pushed via Reverb, not produced by the `setInterval` simulator.

## Where the prototype's fake metrics come from now

| Prototype (simulator) | Production source |
|---|---|
| `recentVotesTickerText` (random names) | last N `votes` joined to users/options; appended live from `VoteCast.voter` |
| `votingVelocity` (`Math.random` ms) | real rate: votes in the last window (e.g. votes/min over trailing 60s), computed server-side |
| `engagementRate` (random drift) | `distinct voters / eligible invitees` (or `/ total votes target`), computed server-side |
| `totalVotersCount` | `votes` distinct `user_id` count for the poll |
| countdown `timerSeconds` | `useCountdown(poll.endsAt)` (display) over server `ends_at` |

> Decide the exact engagement-rate denominator during Phase 5 (eligible-invitee count vs a configured target). Document the chosen formula here when implemented.

## Backend

- `DashboardController@index` — role-aware Inertia render:
  - **admin** → Showrunner panel: the active poll, live tally, metrics, ticker seed, and links to controls ([admin-controls](admin-controls.md)).
  - **creator** → overview of their polls + the active one's results.
- Metrics computed in a small read service (e.g. `PollMetricsService`) or query methods on `Poll`:
  - `totalVoters(Poll)`, `velocityPerMinute(Poll)`, `engagementRate(Poll)`.
- Initial props are the seed; live deltas arrive over the poll channel. `VoteCast` already carries the authoritative `tally` and the new `voter` for the ticker; metrics can be recomputed client-side from the tally or re-broadcast if they need server math.

## Frontend

- `pages/Dashboard.tsx` (admin branch) → ported `AdminDashboard`, fed by props; `usePollChannel` updates tally/ticker/metrics.
- `pages/Polls/Show.tsx` → ported `ResultsTally`:
  - active: animated bars (keep the prototype's `motion` animations), countdown via `useCountdown`.
  - ended: final standings, winner highlight, voter table.
- Sorting/winner logic moves from `App.tsx` math into a small selector util over the `tally` array.

## Acceptance criteria

- [ ] Tally bars reflect real DB counts and animate on live `VoteCast`.
- [ ] Ticker shows real recent voters, newest first, bounded length (prototype capped at 15).
- [ ] Metrics are computed from data, not random; velocity/engagement formulas documented here.
- [ ] When a poll ends (manual or expiry), Show flips to final standings with the correct winner.
- [ ] No simulator code remains.
