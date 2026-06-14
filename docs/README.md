# Vote Showdown - Source of Truth

This `docs/` directory is the authoritative architecture, delivery plan, and feature contract for **Vote Showdown**.

Current stack:

> **React 19 + TypeScript** (frontend) · **Inertia.js v2** (server-driven React) · **Laravel 12** (backend) · **MySQL 8** (database) · **Laravel Reverb + Echo** (real-time)

Every document here is a contract. When code and docs disagree, treat that disagreement as a bug to reconcile before starting the next feature.

## How to Read This

| # | Document | What it owns |
|---|----------|--------------|
| 00 | [`01-overview.md`](01-overview.md) | Product vision, migration context, stack decisions |
| 01 | [`02-architecture.md`](02-architecture.md) | System architecture, request lifecycle, repo layout, conventions |
| 02 | [`03-database.md`](03-database.md) | MySQL schema, migrations, ERD, relationships, seeders |
| 03 | [`04-backend.md`](04-backend.md) | Laravel models, controllers, requests, policies, services, events, routes |
| 04 | [`05-frontend.md`](05-frontend.md) | Inertia + React pages, layouts, components, hooks, types |
| 05 | [`06-auth-and-roles.md`](06-auth-and-roles.md) | Auth, roles, guest accounts, policies |
| 06 | [`07-realtime.md`](07-realtime.md) | Reverb broadcasting, events, Echo hooks, server-authoritative timer |
| Design | [`design-reference.md`](design-reference.md) | Cartoony Neo-Brutalist design tokens and frozen prototype map |
| PM | [`08-delivery-plan.md`](08-delivery-plan.md) | Decision log, work breakdown, readiness/done criteria, risk register |
| Checklist | [`09-execution-checklist.md`](09-execution-checklist.md) | Current delivery state and ordered remaining work |

## Feature Modules

Each module file is a vertical slice spanning DB, backend, frontend, and acceptance criteria.

| Module | Document |
|--------|----------|
| Poll management | [`modules/poll-management.md`](modules/poll-management.md) |
| Voting | [`modules/voting.md`](modules/voting.md) |
| Dashboard & analytics | [`modules/dashboard-and-analytics.md`](modules/dashboard-and-analytics.md) |
| Admin controls | [`modules/admin-controls.md`](modules/admin-controls.md) |
| QR voting | [`modules/qr-voting.md`](modules/qr-voting.md) |
| Public sharing & guest voting | [`modules/public-sharing.md`](modules/public-sharing.md) |

## Current Implementation Baseline

- Laravel/Inertia production scaffold exists at the repo root.
- The original `src/` prototype remains as a frozen design reference only.
- Production React code lives under `resources/js/`; production styling lives in `resources/css/app.css`.
- Poll CRUD, edit, launch, close, restart, countdown/deadline endings, optional passwords, option image/icon fields, authenticated voting, public guest voting, QR/share, public results, scheduled expiry, and Reverb events are implemented in code.
- Magic-link / one-tap invitee voting is still a planned enhancement, not the current low-friction path.
- Dashboard metrics exist but engagement-rate formula is still an open decision.
- Dedicated voter audit/settings surfaces, live Reverb/load verification, CI, accessibility, and deployment hardening remain pending.

## Locked Decisions

1. **Polls are per creator.** Launching a poll ends only that creator's other active poll. Admins retain cross-poll moderation.
2. **Inertia, not a separate REST API.** Controllers return Inertia responses except narrow operational endpoints such as votes, controls, unlock, broadcast auth, and public guest routes.
3. **Tallies are database-derived.** Vote counts come from `votes`, not client state.
4. **Real-time uses Laravel Reverb + Echo.** The app broadcasts coalesced tally snapshots, per-vote ticker events, and poll status changes.
5. **Public guest voting is implemented.** Logged-out voters can vote by email through `/p/{poll}`, creating claimable `is_guest` invitee accounts.
6. **Magic-link voting is pending.** It remains a planned low-friction invitee path and must be reconciled with the implemented guest account model before coding.
7. **Design comes from `src/`.** The aesthetic stays cartoony Neo-Brutalist: thick black outlines, hard offset shadows, bright flat palette, playful motion, and hype copy.
8. **Production target is Forge/VPS.** Reverb, queue workers, scheduler, Redis, MySQL 8, TLS, and rollback need production hardening.

## Status Legend

- `[x]` - implemented or accepted in the current codebase/docs.
- `[~]` - partially implemented or needs verification.
- `[ ]` - not implemented or not verified.
- `[prototype]` - exists in frozen `src/` reference.
- `[production]` - exists in active Laravel/Inertia code.
