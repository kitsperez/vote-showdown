# Module - Dashboard & Analytics

> Vertical slice. Cross-refs: realtime [`../07-realtime.md`](../07-realtime.md), frontend [`../05-frontend.md`](../05-frontend.md).

## Responsibility

The live oversight surface for active and recent polls:

- Live tally race.
- Recent-voters ticker.
- Show metrics.
- Countdown/deadline status.
- Final standings when a poll ends.

## Current State

Implemented:

- `DashboardController@index` renders a role-aware dashboard.
- Admins see an active poll from any creator; non-admin users see their own active poll.
- Dashboard props include active poll, recent polls, and metrics.
- Poll show/results surfaces use real DB tallies and Reverb/Echo hooks.
- Recent voters are loaded from real vote rows.
- Prototype simulator behavior is not the production data source.

Partial/open:

- `engagementRate` currently uses a placeholder/proxy formula; denominator is still an open product decision.
- Dedicated voter audit/log page is not complete.
- Live Reverb behavior still needs multi-browser verification.

## Data Sources

| Metric/display | Production source |
|---|---|
| Tally bars | `poll_options` with `votes_count`, updated by `VoteCast` |
| Recent voters | Latest `votes` joined to users/options, updated by `VoterTicked` |
| Total voters | Distinct `user_id` count for the poll |
| Velocity | Votes in a trailing time window |
| Engagement rate | Open decision; placeholder exists |
| Countdown | `useCountdown(poll.endsAt)` over server `ends_at` |

## Acceptance Criteria

- [x] Tally bars reflect real DB counts.
- [x] Ticker uses real recent voters.
- [x] Metrics are based on queries, not random simulator values.
- [x] Poll show/results flips according to server poll status.
- [x] No production feature depends on the prototype vote simulator.
- [~] Engagement-rate formula needs final product definition.
- [ ] Verify live tally/ticker animation in two browsers with Reverb running.
- [ ] Build dedicated voter audit/log page if retained in scope.
