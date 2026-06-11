# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Vote Showdown** — a Neo-Brutalist real-time voting/polling demo app, scaffolded from Google AI Studio. React 19 + Vite 6 + Tailwind CSS v4, written in TypeScript.

> **Source of truth for the plan: [`docs/README.md`](docs/README.md)** — the authoritative architecture & scaffold for the **React + Inertia + Laravel 12 + MySQL + Reverb** build (per-module specs, schema, contracts, [risk register](docs/08-delivery-plan.md), and the ordered [execution checklist](docs/09-execution-checklist.md)). The root [`README.md`](README.md) is the human entry point that points there.
>
> The sections below describe the **current prototype** (`src/`) as it exists *today* — no Laravel/Inertia code has been written yet. When building production features, follow `docs/` and update both `docs/` and this file as reality changes (e.g. the Commands/Architecture below get rewritten once Phase 0 lands).

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server on http://localhost:3000 (host 0.0.0.0)
npm run build        # production build via Vite -> dist/
npm run preview      # preview the production build
npm run lint         # type-check only: tsc --noEmit (there is no ESLint)
npm run clean        # rm -rf dist server.js (POSIX rm; on Windows use the Bash tool)
```

There is **no test runner** configured. `npm run lint` (TypeScript type-check) is the only verification step.

## Architecture

The entire app is **client-side with in-memory mock state** — there is no backend, no persistence, and no network calls. `App.tsx` is a single stateful container; everything else is presentational.

- **`src/App.tsx`** — the brain. Holds all state (`polls`, `votersList`, `activePollId`, `timerSeconds`, `isSimulating`, live metrics) and all mutation handlers (`handleCastVote`, `handleLaunchPoll`, `handleClosePoll`, `handleRestartPoll`, `handleAddSeconds`). Two `useEffect` intervals drive the live feel: a 1s countdown that auto-ends a poll at 0, and an 1.8s vote simulator (gated by `isSimulating`) that injects random votes from `tickerVoters`.
- **View routing is state-driven, not URL-based.** Two pieces of state select what renders:
  - `currentRole: 'creator' | 'admin' | 'invitee'` — top-level persona (switched via `RoleSelector`).
  - `adminTab: 'dashboard' | 'live_polls' | 'voters' | 'settings'` — sub-view within creator/admin.
  - The render tree in `App.tsx` is a large set of conditional blocks keyed on these two. The `voters`/`settings` tabs are inlined directly in `App.tsx` rather than extracted into components.
- **`src/components/`** — presentational views, all receiving data + callbacks as props from `App.tsx`: `RoleSelector`, `PollCreatorView`, `InviteeView`, `AdminDashboard`, `ResultsTally`.
- **`src/types.ts`** — central type definitions (`Poll`, `PollOption`, `Voter`, `UserRole`, `AdminSubTab`). Start here when changing data shapes.
- **`src/data.ts`** — seed/mock data (`defaultPolls`, `mockVoters`, `tickerVoters`, `bgColors`). "Reset" buttons restore from these.

### Conventions

- **Path alias `@/*` -> repo root** (configured in both `vite.config.ts` and `tsconfig.json`). Note it maps to root, not `src/`. _(Planned change: Phase 0 flips `@` to `resources/js` — see [`docs/02-architecture.md`](docs/02-architecture.md). Don't run with both meanings live.)_
- **Styling is Tailwind v4** imported via `@import "tailwindcss"` in `src/index.css`; fonts are themed there (`Quicksand` sans, `Space Mono` mono). No `tailwind.config.js` — config is the `@theme` block in CSS. Colors are hardcoded hex Tailwind classes (e.g. `bg-[#e4006c]`, `shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`) for the brutalist look; match this style when adding UI.
- **Design comes from `src/` — keep it as a frozen design reference.** All visual/UI design is derived from the prototype files in `src/`; the look is intentionally **cartoony Neo-Brutalism** (thick black outlines, hard offset shadows, bright flat palette, playful tilts/bounce, hype copy). Do **not** delete or gut `src/` during the migration — even after logic is ported to `resources/js`, `src/` stays as the read-only design source of truth. Full tokens & per-screen map: [`docs/design-reference.md`](docs/design-reference.md).
- User feedback for actions is done with `alert()` calls throughout — intentional for the demo.

## Migration status & legacy cruft

This repo began as a Google AI Studio export. The AI Studio artifacts (`metadata.json`, `.env.example`, `assets/.aistudio/`, the AI Studio README) have been **removed**. Remaining legacy items are intentionally kept only until **Phase 0** of the [execution checklist](docs/09-execution-checklist.md) reworks them, and should be cleaned up there:

- **`@google/genai`** is still listed in `package.json` but is **not imported anywhere** — drop it during Phase 0. The app makes no AI calls.
- **`vite.config.ts`** has a `DISABLE_HMR` block (an AI Studio agent-edit workaround). Leave it alone while running the prototype, but **remove it during Phase 0** when merging into the Laravel/Vite pipeline (see [`docs/02-architecture.md`](docs/02-architecture.md)).
- **`index.html`** / root `package.json` / `tsconfig.json` are the prototype's Vite build; Phase 0 merges/replaces them with the Laravel skeleton's equivalents.
