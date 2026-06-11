# 02 · System Architecture

> Part of the [Vote Showdown source of truth](README.md). See also [`01-overview.md`](01-overview.md).

## The big picture

```
┌────────────────────────────────────────────────────────────────────────┐
│  Browser (React 19 + TS, Inertia client)                                 │
│   • Pages mounted by Inertia from server-provided component name + props │
│   • Laravel Echo subscribes to per-poll WebSocket channels               │
└───────────────▲───────────────────────────────▲─────────────────────────┘
                │ Inertia visit (XHR/full)        │ WebSocket (votes, timer)
                │ JSON props in, redirects out     │
┌───────────────┴───────────────┐     ┌───────────┴──────────────┐
│  Laravel 12 (HTTP)             │     │  Laravel Reverb           │
│   Routes → Controllers         │     │   (WebSocket server)      │
│   → FormRequests (validate)    │     │   broadcasts VoteCast,    │
│   → Policies (authorize)       │     │   PollStatusChanged, …    │
│   → Services (domain logic)    │     └───────────▲──────────────┘
│   → Inertia::render(props)     │                 │ broadcast(event)
└───────┬───────────────┬───────┘     ┌───────────┴──────────────┐
        │ Eloquent       │ dispatch    │  Queue worker             │
┌───────▼───────┐  ┌─────▼──────────┐  │  (broadcasting + tally    │
│   MySQL 8     │  │  Events/Jobs   │──┘   recompute jobs)         │
└───────────────┘  └────────────────┘                              │
                                       └───────────────────────────┘
```

**Request flow (typical page):** browser issues an Inertia visit → Laravel route → middleware (`auth`, `HandleInertiaRequests`) → controller authorizes via Policy, loads data via a Service/Eloquent → `Inertia::render('Polls/Show', [...props])` → Inertia client swaps the page component and props without a full reload.

**Mutation flow (cast a vote):** Inertia `router.post()` → `VoteController@store` → `StoreVoteRequest` validates → `VotePolicy` authorizes → `VoteService::cast()` writes the row + recomputes tally → fires `VoteCast` → controller returns a redirect (Inertia reloads only the props it needs) **and** Reverb pushes `VoteCast` to every other connected client.

## Repository layout (target)

Laravel is installed at the repo root; the existing `src/` React tree moves under `resources/js`. Files marked `[prototype]` are ported from today's code.

```
vote-showdown/
├── app/
│   ├── Enums/
│   │   ├── UserRole.php                 # admin | creator | invitee   [new]
│   │   └── PollStatus.php               # draft | active | ended      [new]
│   ├── Events/
│   │   ├── VoteCast.php                 # ShouldBroadcast             [new]
│   │   └── PollStatusChanged.php        # ShouldBroadcast             [new]
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── PollController.php        [new]
│   │   │   ├── VoteController.php        [new]
│   │   │   ├── Admin/ShowControlController.php   [new]
│   │   │   └── DashboardController.php   [new]
│   │   ├── Middleware/
│   │   │   └── HandleInertiaRequests.php # shares auth user, flash    [infra]
│   │   └── Requests/
│   │       ├── StorePollRequest.php      [new]
│   │       └── StoreVoteRequest.php      [new]
│   ├── Models/
│   │   ├── User.php                      [new/extends default]
│   │   ├── Poll.php                      [new]
│   │   ├── PollOption.php                [new]
│   │   └── Vote.php                      [new]
│   ├── Policies/
│   │   ├── PollPolicy.php                [new]
│   │   └── VotePolicy.php                [new]
│   └── Services/
│       ├── PollService.php               # create/launch/close/reset  [new]
│       └── VoteService.php               # cast + tally recompute      [new]
├── bootstrap/app.php                     # middleware, routes, channels wiring [infra]
├── config/                               # reverb.php, broadcasting.php, etc.   [infra]
├── database/
│   ├── factories/                        # User/Poll/Option/Vote factories      [new]
│   ├── migrations/                       # see 03-database.md                    [new]
│   └── seeders/
│       └── DefaultPollsSeeder.php        # ports src/data.ts                     [prototype]
├── resources/
│   ├── css/app.css                       # = old src/index.css (@theme block)   [prototype]
│   └── js/
│       ├── app.tsx                       # Inertia createInertiaApp entry        [infra]
│       ├── bootstrap.ts                  # axios + Echo init                     [infra]
│       ├── types/
│       │   └── models.ts                 # = old src/types.ts, kept in sync      [prototype]
│       ├── layouts/
│       │   ├── ShowrunnerLayout.tsx      # sidebar + header (creator/admin)      [prototype]
│       │   └── InviteeLayout.tsx                                                 [prototype]
│       ├── pages/                        # Inertia page components (see 05)      [new+prototype]
│       ├── components/                   # presentational, ported from src/      [prototype]
│       └── hooks/
│           ├── usePollChannel.ts         # Echo subscription                     [new]
│           └── useCountdown.ts           # render server ends_at                 [new]
├── routes/
│   ├── web.php                           # Inertia routes                        [new]
│   └── channels.php                      # broadcast channel auth                [new]
├── tests/                                # Pest                                  [new]
├── vite.config.ts                        # + laravel-vite-plugin                 [infra]
├── tsconfig.json                         # @/* → resources/js                    [infra]
└── docs/                                 # this source of truth
```

> **Prototype carry-over:** `src/components/*` and `src/types.ts` and `src/index.css` and `src/data.ts` all have direct homes above. Their content is largely reusable; what changes is *where data comes from* (props instead of `useState` in `App.tsx`) — see [`05-frontend.md`](05-frontend.md).

## Conventions (project-wide)

- **Path alias `@/*` → `resources/js/`.** (Differs from the prototype where `@` pointed at repo root.) **Cutover, not overlap (risk M2):** flip the alias in `tsconfig.json` and `vite.config.ts` together in one Phase-0 step *after* `src/` has been copied into `resources/js`. Don't run with both meanings of `@` live, or imports resolve ambiguously. `src/` then stays as frozen design reference only (not on the import path).
- **Controllers stay thin.** Validation in FormRequests, authorization in Policies, business logic in Services. A controller method should read as: authorize → delegate to service → render/redirect.
- **No raw JSON endpoints for page data.** Use `Inertia::render`. The only non-Inertia HTTP is broadcasting auth (`/broadcasting/auth`) and any future webhook.
- **Enums are PHP backed enums** (`UserRole`, `PollStatus`) and are mirrored as TS string-literal unions in `resources/js/types/models.ts`. Keep the two in sync; they are the contract across the Inertia boundary.
- **Money/counts are integers.** Tallies are computed from the `votes` table; never trust a client-sent count.
- **Styling unchanged.** Keep Tailwind v4 `@theme` (Quicksand / Space Mono) and the hardcoded brutalist hex classes & `shadow-[…]` offsets from the prototype. See [`../CLAUDE.md`](../CLAUDE.md).
- **Flash over `alert()`.** Server sets `session()->flash('success', …)`; `HandleInertiaRequests` shares it; a toast component renders it. Remove every prototype `alert()`.

## Phase 0 install strategy — fresh skeleton, then port (risk R4) `[infra]`

**Do not install Laravel on top of this existing Vite app at the repo root** — `package.json`, `vite.config.ts`, and directory collisions make that a high-risk big-bang. Instead, on a branch:

1. Scaffold a clean **Laravel 12 + React/Inertia/TS starter** in a sibling skeleton.
2. Copy `src/` into the repo as the frozen design reference, and port its code into `resources/js`.
3. Merge the starter's `package.json`/Vite config with the prototype's React + Tailwind plugins; drop the AI Studio `DISABLE_HMR` block and `@google/genai`.
4. Flip the `@` alias (M2), wire Ziggy (H1) and Echo (R3), then verify `npm run build` + `php artisan test` before merging.

## Environment & tooling `[infra]`

- **Laragon** provides PHP, MySQL, and Composer on Windows. Run PHP/artisan via the Bash tool or PowerShell.
- Local dev needs **five processes**: `php artisan serve` (or Laragon vhost), `npm run dev` (Vite), `php artisan reverb:start` (WebSockets), `php artisan queue:work` (broadcasts), and `php artisan schedule:work` (auto-end expired polls — see [`modules/admin-controls.md`](modules/admin-controls.md)). A `composer dev` script (e.g. `concurrently`) orchestrates them — define it during Phase 0.
- `.env` keys beyond Laravel defaults: `DB_*` (MySQL), `BROADCAST_CONNECTION=reverb`, `REVERB_APP_*`, `VITE_REVERB_*`, `QUEUE_CONNECTION=database` (Redis in prod). See [`07-realtime.md`](07-realtime.md).

## Production topology — Forge + VPS (decision D4) `[infra]`

Laragon is local-only; production runs on a **Laravel Forge–provisioned VPS** because the stack needs **three always-on processes** a typical PHP host can't run:

- **Supervisor** keeps `php artisan reverb:start`, `php artisan queue:work`, and the scheduler alive (auto-restart on crash — risk R6).
- **Scheduler** via cron (`* * * * * php artisan schedule:run`) drives the expired-poll sweeper.
- **TLS** terminates at the web server; Reverb is served over `wss://` (set `REVERB_SCHEME=https`, `VITE_REVERB_SCHEME=https`).
- **Redis** for queue + cache (the `Cache::lock` dedupe and broadcast coalescing want a fast, shared store) — `database` driver is fine locally, not for a hot prod poll.
- **MySQL 8** managed by Forge. Zero-downtime deploys keep the prior release for instant rollback.

See [`08-delivery-plan.md`](08-delivery-plan.md) for environments, CI gates, and the risk register.
