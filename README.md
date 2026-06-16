# Vote Showdown

A high-energy, real-time polling app with a game-show ("showdown") feel: **cartoony Neo-Brutalist** UI, live tallies, and countdown/deadline poll endings.

> **Status:** Laravel/Inertia production scaffolding is in place and the core polling flow is implemented. The prototype in [`src/`](src) is kept as the **frozen design reference**; production code now lives primarily in `app/`, `routes/`, `database/`, and `resources/js/`.

## Target stack

**React 19 + TypeScript** · **Inertia.js v2** · **Laravel 12** · **MySQL 8** · **Laravel Reverb + Echo** (real-time) · **Tailwind CSS v4** · **Vite 6**

## Roles

- **Admin** - manages users, moderates any poll, adds time, deletes polls, deletes votes, and oversees the live show.
- **Poll Creator** - builds, edits, launches, closes, and restarts their own polls.

Voters are **not** accounts: anyone votes through authenticated or public guest voting and is deduplicated by a `voter_key` (email or device), never a user row.

## Documentation (source of truth)

| Where | What |
|-------|------|
| [`docs/README.md`](docs/README.md) | Architecture and scaffold index - start here |
| [`docs/08-delivery-plan.md`](docs/08-delivery-plan.md) | Phases, Definition of Ready/Done, risk register |
| [`docs/09-execution-checklist.md`](docs/09-execution-checklist.md) | Current delivery state and ordered remaining work |
| [`docs/design-reference.md`](docs/design-reference.md) | Cartoony Neo-Brutalist design tokens from `src/` |
| [`AGENTS.md`](AGENTS.md) / [`CLAUDE.md`](CLAUDE.md) | Agent guidance for working in this repo |

## Keeping the plan in sync

The `docs/` plan, the [decision log](docs/08-delivery-plan.md), and the [execution checklist](docs/09-execution-checklist.md) are the source of truth and must track the code. **Any change that adds, removes, or alters a feature, schema, route, decision, or convention must also update those docs** in the same change.

A dedicated subagent automates this: [`.claude/agents/plan-sync.md`](.claude/agents/plan-sync.md). After implementing something, hand off to it - e.g. *"use the plan-sync agent to update the docs and checklist"* - and it reconciles `docs/`, the decision log, the checklist, `AGENTS.md`, `CLAUDE.md`, and this README against the actual code (docs only; it never writes feature code).

## Getting started

The Laravel/Inertia app has replaced the old standalone Vite prototype build. Use the checklist in [`docs/09-execution-checklist.md`](docs/09-execution-checklist.md) for the current delivery state, remaining gaps, and next coding priorities.
