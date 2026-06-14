# AGENTS.md

This file provides guidance to Codex and other coding agents when working in this repository.

## Project

**Vote Showdown** is a cartoony Neo-Brutalist real-time voting/polling app. The original Google AI Studio React prototype remains in `src/` as a frozen visual/design reference. The active production app is Laravel 12 + Inertia v2 + React 19 + TypeScript + MySQL + Reverb.

> **Source of truth for the plan:** [`docs/README.md`](docs/README.md). The ordered delivery state lives in [`docs/09-execution-checklist.md`](docs/09-execution-checklist.md). Update `docs/`, this file, and [`README.md`](README.md) whenever a feature, schema, route, convention, or delivery decision changes.

## Commands

```bash
composer install     # install PHP dependencies
npm install          # install frontend dependencies
composer dev         # run Laravel server, queue listener, and Vite together
npm run dev          # Vite dev server only
npm run build        # production frontend build
npm run lint         # ESLint with auto-fix
npm run format       # Prettier over resources/
php artisan test     # Pest test suite
```

Pest is configured for backend/feature coverage. Frontend verification currently uses ESLint, TypeScript through the build, and `npm run build`.

## Architecture

The active app is a Laravel/Inertia production scaffold with persistent poll data, Inertia React pages, Reverb/Echo live updates, public guest voting, QR sharing, password gates, and Pest feature tests.

- **`app/`** - Laravel domain layer: enums, models, policies, controllers, requests, services, events, presenter support.
- **`routes/`** - Inertia pages, public guest voting, QR join, controls, auth/settings, broadcast channels, and scheduler wiring.
- **`database/`** - migrations, factories, and seeders for users, polls, options, votes, guest accounts, option media, and ending/password fields.
- **`resources/js/`** - active Inertia React app: pages, layouts, hooks, shared UI, and showdown components.
- **`resources/css/app.css`** - Tailwind v4 theme and Neo-Brutalist styling tokens ported from the prototype.
- **`src/`** - frozen client-side prototype and design reference only. Do not delete or gut this directory during migration work.

## Current Feature State

- Poll CRUD, edit, delete, launch, close, restart, countdown/deadline endings, optional access password, and option image/icon fields exist.
- Authenticated voting and public no-login guest voting exist; public guest voting creates claimable `is_guest` invitee accounts by email.
- QR/share links target public voting/results surfaces.
- Real-time broadcasts use Reverb/Echo with tally, ticker, and status events. Public pages also listen on public poll channels.
- Dashboard metrics exist but engagement-rate denominator remains an open product decision.
- Remaining known work is tracked in [`docs/09-execution-checklist.md`](docs/09-execution-checklist.md), especially magic-link flow, voter audit/settings surfaces, live Reverb/load verification, CI, and deploy hardening.

## Conventions

- **Path alias `@/*` maps to `resources/js`.** `src/` is not on the production import path.
- **Design comes from `src/`.** Keep the cartoony Neo-Brutalist look: thick black outlines, hard offset shadows, bright flat palette, playful motion, and hype copy. Full reference: [`docs/design-reference.md`](docs/design-reference.md).
- **Use flash/toast for production feedback.** `alert()` belongs only to the frozen prototype reference.
- **Controllers stay thin.** Validation belongs in FormRequests, authorization in Policies, business logic in Services.
- **Tallies are derived from votes.** Never trust client-sent counts.
- **Update docs with code changes.** If implementation changes the contract, update the relevant plan/module/checklist in the same change.
