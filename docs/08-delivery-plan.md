# 08 · Delivery Plan (PM Layer)

> Part of the [Vote Showdown source of truth](README.md). This is the "is it actually ready to build and ship" layer: resolved decisions, work breakdown, gates, risks, environments.

## Resolved decisions (decision log)

| # | Decision | Choice | Impact |
|---|----------|--------|--------|
| D1 | Poll scope | **Per-creator independent** — one active poll *per creator*, not global | Launch ends only the *same creator's* active poll; dashboards & channels are per-poll; admins retain cross-poll moderation/control via `PollPolicy@control` but there is no single global "stage" |
| D2 | Voter identity | Full accounts **+ magic-link / one-tap voting** | Invitees can vote via emailed magic link (low-friction QR flow) that creates/links a lightweight account; one vote per user per poll still holds |
| D3 | Real-time | Laravel Reverb + Echo | Always-on WS + queue + scheduler processes required |
| D4 | Production | **Laravel Forge + VPS** | Supervisor-managed Reverb/queue/scheduler; deploy pipeline via Forge |
| D5 | Design | Cartoony Neo-Brutalism sourced from frozen `src/` | See [`design-reference.md`](design-reference.md) |
| D6 | QR scan-to-vote | One QR per poll encodes a public `polls.join` URL; auth happens behind it | New entry point for live audiences — [`modules/qr-voting.md`](modules/qr-voting.md) |
| D7 | Poll end mode | Polls end by **countdown** (`duration_seconds`) **or** an absolute **deadline date** (`deadline_at`); both resolve to `ends_at` | [`modules/poll-management.md`](modules/poll-management.md), [`03-database.md`](03-database.md) |
| D8 | Public sharing & guest voting | Every poll has a public **shareable link** → sidebar-less **guest page**, viewable with **no login**. Guests **vote by email**; first vote creates a claimable `is_guest` account (one identity = one vote). QR + share target this page. Resolves the D2 magic-link/account-model open items. | [`modules/public-sharing.md`](modules/public-sharing.md) |
| D9 | Optional poll password | A poll may set an **access password** required before voting; if none is set, voting proceeds anytime. Stored hashed (`polls.access_password`), verified once then remembered per session/cookie. | [`modules/poll-management.md`](modules/poll-management.md) |
| D10 | Option images / icons | Each poll option may have an **uploaded image** (`image_path`) or a **named icon** (`icon`), shown on the option card in place of the number badge. | [`modules/poll-management.md`](modules/poll-management.md) |

## Open decisions (must close before the noted phase)

| Item | Needed by | Owner |
|------|-----------|-------|
| Engagement-rate denominator (eligible invitees vs configured target) | Phase 5 | Product |
| New-signup default role policy (auto-invitee + manual elevation, or invite-only creators/admins) | Phase 1 | Product |
| ~~Magic-link account model (full user row vs claimable guest)~~ | ✅ Resolved by D8 — claimable `is_guest` user row keyed by email | — |
| Tally-broadcast coalescing window (e.g. 250ms) tuning | Phase 4 | Eng |

## Work breakdown (epics → tickets)

Sized in T-shirt points; each ticket carries the acceptance criteria already written in its module doc.

| Phase | Epic | Key tickets | Size |
|-------|------|-------------|------|
| 0 | Scaffold | Fresh Laravel 12 skeleton on a branch; port `src/` → `resources/js`; wire Vite (laravel-vite-plugin + existing React/Tailwind); MySQL `.env`; Inertia + React starter; **add Ziggy**; `composer dev` orchestrator (app+vite+reverb+queue) | M |
| 1 | Data & auth | Migrations + models + factories; seeders; auth (starter kit); roles + `EnsureUserHasRole`; **magic-link voting** flow | L |
| 2 | Poll management | `PollService` (create/launch/close/restart); `PollController`; Create/Index/Show pages | L |
| 3 | Voting | `VoteService` (lock-based dedupe); `VoteController`; Vote page; tally read model | M |
| 4 | Real-time | Reverb + Echo install; `VoteCast`/`PollStatusChanged`; channel auth; socket-id forwarding; **tally-broadcast coalescing**; `useCountdown` | M |
| 5 | Dashboard/admin | metrics service; ShowControl; scheduler auto-end; voter log | M |
| 6 | Hardening | Pest coverage; rate limits (votes/create/control); enum-drift test; a11y pass; Forge deploy | M |

**Critical path:** 0 → 1 → 2 → 3 → 4. Phase 5 depends on 4; Phase 6 runs continuously but gates release.

## Definition of Ready (a ticket may start only if…)

- Acceptance criteria are written and testable (module docs provide them).
- No unresolved "open decision" blocks it (see table above).
- Data shape (migration/props/TS type) is specified or unchanged.
- Authorization rule is named (which policy/ability/role).

## Definition of Done (a ticket is done only if…)

- Acceptance criteria pass; Pest test(s) added/updated and green.
- `npm run build` + `php artisan test` pass in CI.
- Server enforces authorization (not just hidden in UI); inputs validated in a FormRequest.
- No `alert()`, no leftover simulator/mock for that feature; flash→toast used.
- Docs updated if the contract changed (enums/types/routes).

## Environments

| Env | Purpose | Notes |
|-----|---------|-------|
| Local | Laragon (PHP/MySQL) + Vite + Reverb + queue + scheduler | 4–5 processes via `composer dev`; `schedule:work` for auto-end |
| Staging | Forge VPS mirror of prod | smoke test broadcasting under real WS |
| Production | Forge + VPS | Supervisor runs `reverb:start`, `queue:work`, scheduler cron; Redis for queue/cache; MySQL 8; TLS for `wss://` |

## CI gates (minimum)

`php artisan test` (Pest) · `npm run build` (Vite/TS compile) · `tsc --noEmit` · enum-contract drift test (PHP enums == TS unions). Block merge on any red.

## Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R1 | Broadcast flooding on a hot poll (votes/sec × clients) | High | High | Coalesce tally broadcasts to ≤4/s ([`07-realtime.md`](07-realtime.md)); load-test in staging |
| R2 | Vote dedupe race (single-choice, concurrent) | High | High | Atomic `Cache::lock` per user+poll ([`modules/voting.md`](modules/voting.md)) |
| R3 | `toOthers()` self-echo double count | Med | Med | Forward Echo socket id on Inertia requests ([`07-realtime.md`](07-realtime.md)) |
| R4 | Big-bang in-place Laravel install corrupts the Vite app | Med | High | Fresh skeleton on a branch, port in; never install over existing root |
| R5 | Magic-link voting abuse / spam | Med | Med | Rate-limit link issuance + voting; signed, expiring links |
| R6 | Reverb process dies in prod, silently no live updates | Med | Med | Supervisor auto-restart + health check + client reconnect/poll fallback |
| R7 | Enum/type contract drift (PHP↔TS) breaks pages silently | Med | Med | CI drift test (gate) |
| R8 | Carbon 3 time math regressions (timer) | Med | Med | Use `isFuture()` guard; unit-test `remainingSeconds` |

## Rollback / safety

- Migrations are reversible (`down()` defined) or paired with a re-create seeder for demo data.
- Feature work behind branches; Forge keeps the prior release for instant rollback.
- Real-time degrades gracefully: if Echo can't connect, the client falls back to a periodic `router.reload({ only: ['poll'] })` so tallies still update (document in Phase 4).
