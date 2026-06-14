# 01 - Overview

> Part of the [Vote Showdown source of truth](README.md).

## Product

**Vote Showdown** is a high-energy real-time polling app with a game-show feel: bright cartoony Neo-Brutalist UI, live tallies, QR/public voting, and countdown/deadline poll endings.

Personas:

- **Creator** - creates, edits, launches, closes, and restarts their own polls.
- **Admin / Showrunner** - moderates across polls, adds time, deletes polls, and oversees the live show.
- **Invitee / Voter** - votes through authenticated or public guest flows and watches the live tally.

The signature experience is the live tally race: votes land, connected screens update, recent voters tick in, and the server-authoritative timer ends the poll.

## Current Baseline

The project is no longer only a client-side prototype. The Laravel/Inertia production scaffold exists and the core polling flow is implemented.

| Concern | Current production state |
|---|---|
| State/persistence | MySQL through Laravel/Eloquent |
| Frontend | Inertia React pages under `resources/js` |
| Design reference | Frozen prototype under `src/` |
| Voting | Authenticated voting and public guest voting |
| Live updates | Reverb/Echo events for tally, ticker, and status |
| Timer | Server `ends_at`; frontend countdown is display-only |
| Feedback | Inertia flash/toast |
| Tests | Pest feature/unit test structure exists |

## Stack Decisions

| Layer | Choice |
|---|---|
| Backend | Laravel 12 |
| Frontend | React 19 + TypeScript |
| Glue | Inertia.js v2 |
| Database | MySQL 8 |
| Realtime | Laravel Reverb + Echo |
| Styling | Tailwind CSS v4 |
| Build | Vite 6 |
| Production target | Forge/VPS with Redis, Supervisor, queue, scheduler, Reverb |

## Roadmap From Here

Completed or mostly completed:

- Laravel/Inertia scaffold.
- Data model, auth starter, roles, policies, services, presenters.
- Poll management, voting, public guest voting, QR/share, realtime events, password gates, end modes, option media fields.
- Dashboard and poll show surfaces.

Remaining:

- Magic-link / one-tap invitee voting decision and implementation.
- Canonical QR target decision.
- Engagement-rate formula decision.
- Dedicated voter audit/log page and product settings decision.
- Live Reverb two-browser and burst/load verification.
- Option image upload/render verification.
- CI gates, enum/type drift test, accessibility pass, and deployment hardening.

See [`09-execution-checklist.md`](09-execution-checklist.md) for the tactical checklist.

## Non-Goals For Now

- Native/mobile apps.
- AI features.
- Multi-tenant organizations.
- Separate REST API for page data.
