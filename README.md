# Vote Showdown

A high-energy, real-time polling app with a game-show ("showdown") feel — **cartoony Neo-Brutalist** UI, live tallies, and a countdown that ends each poll automatically.

> **Status:** migrating from a client-side prototype to a production app. The prototype in [`src/`](src) is kept as the **frozen design reference**; production code is being built per the plans in [`docs/`](docs/README.md).

## Target stack

**React 19 + TypeScript** · **Inertia.js v2** · **Laravel 12** · **MySQL 8** · **Laravel Reverb + Echo** (real-time) · **Tailwind CSS v4** · **Vite 6**

## Roles

- **Creator** — builds and launches polls (one active poll per creator).
- **Admin / Showrunner** — controls the live show (timer, close, restart) and moderates any poll.
- **Invitee / Voter** — casts a vote via a low-friction magic link; sees the live tally race.

## Documentation (source of truth)

| Where | What |
|-------|------|
| [`docs/README.md`](docs/README.md) | Architecture & scaffold index — start here |
| [`docs/08-delivery-plan.md`](docs/08-delivery-plan.md) | Phases, Definition of Ready/Done, risk register |
| [`docs/09-execution-checklist.md`](docs/09-execution-checklist.md) | The actionable, ordered build checklist |
| [`docs/design-reference.md`](docs/design-reference.md) | Cartoony Neo-Brutalist design tokens (from `src/`) |
| [`CLAUDE.md`](CLAUDE.md) | Guidance for working in this repo |

## Getting started

Production scaffolding has not begun yet — see **Phase 0** in [`docs/09-execution-checklist.md`](docs/09-execution-checklist.md). The legacy prototype build files at the repo root (`package.json`, `vite.config.ts`, `index.html`) will be merged into the Laravel skeleton during that phase.
