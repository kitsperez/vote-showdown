# 01 · Overview

> Part of the [Vote Showdown source of truth](README.md). Prototype context: [`../CLAUDE.md`](../CLAUDE.md).

## Product

**Vote Showdown** is a high-energy, real-time polling app with a game-show ("showdown") feel. Three personas drive it:

- **Creator** — designs polls (title, description, 2–10 options, single/multiple choice, duration) and launches them.
- **Admin / Showrunner** — oversees the running show: controls the countdown timer, adds time, closes a poll early, resets state, and audits the voter log.
- **Invitee / Voter** — joins an active poll and casts a vote; sees the live tally race.

The signature experience is the **live tally**: as votes land, every connected screen updates instantly, a ticker scrolls recent voters, and a server-authoritative countdown ends the poll automatically.

## Where we are vs. where we're going

| Concern | Prototype today (`src/`) | Production target |
|---------|--------------------------|-------------------|
| State | In-memory React state in `App.tsx` | MySQL via Laravel + Eloquent |
| Persistence | None (refresh = reset) | Durable, multi-user |
| "Live" votes | Fake `setInterval` simulator | Real `VoteCast` broadcasts over Reverb |
| Routing | State flags (`currentRole`, `adminTab`) | Inertia pages + real URLs |
| Auth | None (role is a dropdown) | Laravel auth, role enum, policies |
| Timer | Client `setInterval` on `timerSeconds` | Server `ends_at`; client renders remaining time |
| Feedback | `alert()` calls | Inertia flash messages + toasts |

## Stack decisions & rationale

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | **Laravel 12 (PHP 8.3+)** | Batteries-included: auth, validation, queues, broadcasting, Eloquent. Fits the Laragon/Windows dev environment already in use. |
| Frontend | **React 19 + TypeScript** | Carry over the existing component code with minimal rewrites. |
| Glue | **Inertia.js v2 (React adapter)** | Server-driven routing & data with a SPA feel, **no separate API to build or version**. Controllers pass typed props straight into pages. |
| Build | **Vite 6** | Already configured; Laravel's `laravel-vite-plugin` slots in alongside the existing React + Tailwind plugins. |
| Styling | **Tailwind CSS v4** | Keep the prototype's brutalist look 1:1 (see `../CLAUDE.md`). |
| Database | **MySQL 8** | Asked for; relational shape fits polls→options→votes cleanly. |
| Real-time | **Laravel Reverb + Laravel Echo** | First-party, self-hosted WebSocket server; no third-party cost; native broadcasting integration. |
| Queue | **Database driver** (dev) → Redis (prod) | Broadcast events and tally recomputation run off the request cycle. |

## Migration plan (phased)

Build in vertical slices so the app is runnable after each phase.

1. **Phase 0 — Scaffold `[infra]`.** Install Laravel into this repo, wire the existing Vite/React/Tailwind config into Laravel's pipeline, set up Inertia + the React starter, configure MySQL & `.env`. See [`02-architecture.md`](02-architecture.md).
2. **Phase 1 — Data & auth.** Migrations, models, seeders ([`03-database.md`](03-database.md)); login/register with the three roles ([`06-auth-and-roles.md`](06-auth-and-roles.md)).
3. **Phase 2 — Poll management.** Creator can build/launch polls; lifecycle (draft→active→ended). [`modules/poll-management.md`](modules/poll-management.md).
4. **Phase 3 — Voting (persisted).** Invitee casts a real, deduped vote; tallies read from DB. [`modules/voting.md`](modules/voting.md).
5. **Phase 4 — Real-time.** Reverb + Echo; replace the simulator with live `VoteCast` broadcasts; server-authoritative timer. [`07-realtime.md`](07-realtime.md).
6. **Phase 5 — Dashboard, admin controls & analytics.** Live metrics, results tally, voter log, close/reset/add-time. [`modules/dashboard-and-analytics.md`](modules/dashboard-and-analytics.md), [`modules/admin-controls.md`](modules/admin-controls.md).
7. **Phase 6 — Hardening.** Tests (Pest), rate limiting on voting, authorization coverage, production queue/broadcast config.

## Non-goals (for now)

- No native/mobile apps (responsive web only — the prototype already targets this).
- No AI features. `@google/genai` from the prototype is dropped unless a concrete use case appears.
- No multi-tenancy/orgs; a flat user base with roles is sufficient.
