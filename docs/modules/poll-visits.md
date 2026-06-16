# Module - Poll Visit Statistics (Backend only) `[planned]`

> Vertical slice for D17. Cross-refs: database [`../03-database.md`](../03-database.md), dashboard [`dashboard-and-analytics.md`](dashboard-and-analytics.md), backend [`../04-backend.md`](../04-backend.md).

## Responsibility

Record how many times a poll's pages are accessed so admins/creators can see reach and visit→vote conversion. **Backend/admin only — there is no public-facing visit UI.**

## Database

- New `poll_visits` table: `poll_id`, `user_id` (nullable, for logged-out guests), `ip_hash` (salted hash only — never the raw IP), `user_agent`, `visited_at`.
- Denormalized `polls.visits_count` for cheap totals.
- Indexed on `(poll_id, visited_at)` for time-series queries.

## Backend

- `PollVisit` model + relation `Poll::visits()`.
- `PollVisitService::record(Poll $poll, Request $request)`:
  - Deduped **one visit per session per poll** (session/cookie key `visited_poll_{uuid}`) so refreshes don't inflate counts.
  - Hashes the IP with the app key/salt before storage (R13 — no raw PII).
  - Inserts a `poll_visits` row and increments `polls.visits_count`.
- Called from `PublicPollController@show`, `PublicPollController@results`, and `PollController@show`.

## Surfacing (admin/backend)

- Dashboard metrics and the admin poll list gain: total visits, unique visitors (distinct `user_id`/`ip_hash`), and visit→vote conversion (`votes / visits`). Helps resolve the open engagement-rate denominator decision.

## Acceptance Criteria

- [ ] A visit is recorded at most once per session per poll.
- [ ] `polls.visits_count` increments in step with recorded rows.
- [ ] Raw IP is never persisted (only a salted hash).
- [ ] Logged-out guest visits record with `user_id = null`.
- [ ] Visit stats appear in admin/dashboard surfaces only; no public exposure.
- [ ] Recording tolerates failure without blocking the page render.
