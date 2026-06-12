# Vote Showdown — Source of Truth

This `docs/` directory is the **authoritative architecture and scaffold** for evolving **Vote Showdown** from the current client-side AI Studio prototype (see [`../CLAUDE.md`](../CLAUDE.md)) into a production application:

> **React 19 + TypeScript** (frontend) · **Inertia.js v2** (the glue) · **Laravel 12** (backend) · **MySQL 8** (database) · **Laravel Reverb + Echo** (real-time)

Every document here is a **scaffold + contract**: it describes the files to create, their responsibilities, the data shapes, and the conventions to follow. When code and these docs disagree, treat the disagreement as a bug to reconcile — update whichever is wrong.

## How to read this

Read top-to-bottom for the first time; afterwards jump to the module you're touching.

| # | Document | What it owns |
|---|----------|--------------|
| 00 | [`01-overview.md`](01-overview.md) | Product vision, the prototype→production migration plan, stack decisions & rationale |
| 01 | [`02-architecture.md`](02-architecture.md) | System architecture, Inertia request lifecycle, full repo directory layout, conventions |
| 02 | [`03-database.md`](03-database.md) | MySQL schema, migrations, ERD, relationships, seeders |
| 03 | [`04-backend.md`](04-backend.md) | Laravel: models, controllers, form requests, policies, services, events, routes |
| 04 | [`05-frontend.md`](05-frontend.md) | Inertia + React: pages, layouts, shared components, hooks, prototype→page mapping |
| 05 | [`06-auth-and-roles.md`](06-auth-and-roles.md) | Authentication, the three roles, gates & policies |
| 06 | [`07-realtime.md`](07-realtime.md) | Reverb broadcasting, events, Echo client, server-authoritative timer |
| 🎨 | [`design-reference.md`](design-reference.md) | **Design source of truth** — cartoony Neo-Brutalist tokens, extracted from `src/`, per-screen reference map |
| 📋 | [`08-delivery-plan.md`](08-delivery-plan.md) | **PM layer** — decision log, work breakdown, Definition of Ready/Done, environments, CI gates, risk register |
| ✅ | [`09-execution-checklist.md`](09-execution-checklist.md) | **The ordered build checklist** — every step from cleanup → go-live, with hardening fixes embedded. Start here when coding begins. |

### Feature modules (vertical slices)

Each module file is a self-contained scaffold spanning DB → backend → frontend for one product capability.

| Module | Document |
|--------|----------|
| Poll management (create, launch, lifecycle) | [`modules/poll-management.md`](modules/poll-management.md) |
| Voting (cast vote, tally, dedupe) | [`modules/voting.md`](modules/voting.md) |
| Dashboard & analytics (live metrics, results) | [`modules/dashboard-and-analytics.md`](modules/dashboard-and-analytics.md) |
| Admin controls (timer, close, reset, voter log) | [`modules/admin-controls.md`](modules/admin-controls.md) |
| QR voting (scan-to-vote entry point) | [`modules/qr-voting.md`](modules/qr-voting.md) |
| Public sharing & guest voting (no-login guest page) | [`modules/public-sharing.md`](modules/public-sharing.md) |

## Locked decisions

These were decided at project inception and propagate through every doc. Full decision log + risk register: [`08-delivery-plan.md`](08-delivery-plan.md).

1. **All three roles have real accounts** (email + password); invitees reach theirs via **magic-link / one-tap voting** to keep the QR flow low-friction (D2). One vote per user per poll (unless the poll allows multiple). No anonymous voting.
2. **Polls are per-creator** — one active poll *per creator*, not a single global stage (D1). Admins retain cross-poll moderation.
3. **Real-time via Laravel Reverb + Laravel Echo**, **split into a coalesced tally event + a per-vote ticker**, excluding the sender via a forwarded socket id (D3; see [`07-realtime.md`](07-realtime.md)). The prototype's fake `setInterval` simulator is removed.
4. **Production on Laravel Forge + VPS** with Supervisor-managed Reverb/queue/scheduler and Redis (D4).
5. **Inertia, not a separate REST API.** Controllers return Inertia responses (props), not JSON, except a thin set of endpoints documented in [`04-backend.md`](04-backend.md). Frontend route names require **Ziggy**.
6. **Design comes from `src/`, and the look is cartoony.** All visual design is derived from the prototype files in `src/`, which are **kept as a frozen, read-only design reference** (never deleted during the migration). The aesthetic is cartoony Neo-Brutalism — thick black outlines, hard offset shadows, bright flat palette, playful tilts/bounce, hype copy. Tokens and per-screen reference map: [`design-reference.md`](design-reference.md).

## Status legend used in these docs

- `[prototype]` — exists today in `src/`, must be ported.
- `[new]` — to be built from scratch.
- `[infra]` — framework/tooling setup, not feature code.
