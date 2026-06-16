# CODEX.md
# Vote Showdown — Developer Reference

> **Realigned to the source of truth.** This file was rewritten to match the actual
> Vote Showdown stack (Laravel 12 + Inertia v2 + React 19 + Reverb). The earlier
> "QR Voting Application" version described a different architecture (REST API + Sanctum +
> standalone SPA) that we are **not** adopting — see [`comparison.md`](comparison.md).
> The canonical docs live in [`../README.md`](../README.md); this is a secondary quick reference.

---

## 1. Project Overview

A cartoony Neo-Brutalist real-time voting app. Authenticated **Poll Creators** and **Admins**
build polls; anyone can vote — logged in, or as a public guest by email/device. Voting is
deduped per canonical `voter_key`, tallies are derived from vote rows, and results update live
over WebSockets. The frozen `src/` prototype is design reference only.

---

## 2. Tech Stack (do not change without a source-of-truth decision)

| Layer | Technology | Notes |
|---|---|---|
| Backend framework | Laravel 12 | — |
| Server↔client | **Inertia.js v2** | Not a REST API. Controllers return `Inertia::render`. |
| Database | MySQL 8 | — |
| Auth | Laravel starter (session web guard) | Login/register/reset/verify/settings from the starter kit. **No Sanctum token API.** |
| Roles | `users.role` enum | `admin` / `creator` (see D20). No separate `admins` table. |
| Real-time | **Laravel Reverb + Echo** (`@laravel/echo-react`) | Already implemented. |
| Frontend framework | React 19 | Pages mounted by Inertia, not React Router. |
| Frontend language | TypeScript | `resources/js/types/models.ts` mirrors PHP presenters/events. |
| Routing helper | Ziggy | `route()` in TS. |
| Styling | **Tailwind v4** | Brutalist tokens in `resources/css/app.css`. No shadcn/ui. |
| UI primitives | Radix-based starter set under `resources/js/components/ui/` | — |
| QR | `qrcode.react` | Generated client-side; no stored QR images. |
| Build | Vite 6 | `npm run build`. |
| Testing (backend) | **Pest** | Feature + unit. |
| Frontend verification | ESLint, TypeScript via build, `npm run build` | No Vitest/Playwright in the stack today. |
| Server | Forge/VPS + web server + TLS | Redis + Supervisor for queue/Reverb/scheduler in prod. |

> State/data is owned by the server and passed as Inertia props. There is **no** Zustand,
> React Router, or Axios layer — Inertia's `router` and `useForm` cover navigation and mutations.

---

## 3. Project Structure (single Laravel app, not split front/back)

```
app/
  Enums/            UserRole, PollStatus
  Events/           VoteCast, VoterTicked, PollStatusChanged
  Http/
    Controllers/    Dashboard, Poll, PublicPoll, Vote, Admin/ShowControl, Admin/User, Auth, Settings
    Middleware/     HandleInertiaRequests, EnsureUserHasRole
    Requests/       Store/Update poll, vote, guest vote, auth/settings requests
  Models/           User, Poll, PollOption, Vote (+ PollVisit, planned D17)
  Policies/         PollPolicy (+ UserPolicy, planned D16)
  Services/         PollService, VoteService (+ PollVisitService, planned D17)
  Support/          PollPresenter, VoterPresenter, VoterIdentity
database/
  migrations/       users, polls, poll_options, votes (+ poll_visits, planned D17)
  factories/        User, Poll, PollOption, Vote
  seeders/          UserSeeder, DefaultPollsSeeder
resources/
  css/app.css       Tailwind v4 theme + brutalist tokens
  js/
    app.tsx         Inertia entry (createInertiaApp)
    components/      app shell, ui/ primitives, showdown/ components
    hooks/           use-countdown, use-poll-channel, use-public-poll-channel, use-appearance
    layouts/         showdown / guest / app / auth / settings layouts
    pages/           dashboard, polls/*, public-poll, public-results, auth/*, settings/*, welcome
    types/models.ts  TS read-model contract (mirror of PHP presenters/events)
routes/
  web.php           Inertia pages, public/guest, voting, QR join, controls, admin users
  auth.php          auth routes
  settings.php      settings routes
  channels.php      broadcast channel authorization
  console.php       scheduled expired-poll auto-end
src/                FROZEN prototype — design reference only, not imported in production
tests/              Pest unit + feature
```

---

## 4. Local Development

Prereqs: PHP 8.x, Composer, Node, MySQL 8 (Reverb + scheduler added to local orchestration when
live-testing realtime).

```
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link        # required for option image rendering (D10a)
composer dev                    # Laravel server + queue listener + Vite
# or: npm run dev (Vite only)
```

Default admin is created by `UserSeeder` (dev/bootstrap only). Other accounts come from
admin User Management (D16).

---

## 5. Coding Standards & Conventions

### PHP / Laravel
- **Controllers stay thin.** Validation → FormRequests, authorization → Policies, business logic → Services.
- **Tallies are derived from `votes`** — never trust client-sent counts (D3).
- **Inertia, not REST.** Controllers return `Inertia::render`; the only non-Inertia endpoints are
  the narrow operational ones (vote, controls, unlock, public guest vote, broadcast auth).
- **Props are camelCase**, shaped by `PollPresenter` / `VoterPresenter`.
- Classes PascalCase, methods/vars camelCase, DB columns snake_case.

### TypeScript / React
- Components PascalCase; hooks `useX`. Props typed — no `any`.
- Tailwind classes only; no inline styles. **No `dangerouslySetInnerHTML`** on user content.
- Keep `resources/js/types/models.ts` in sync with `app/Enums/*`, `PollPresenter`, and
  `*::broadcastWith()`.
- Local UI state only; server data arrives as props or via Echo hooks.

### Design
- Cartoony Neo-Brutalist look from `src/`: thick black outlines, hard offset shadows, bright flat
  palette, playful motion, hype copy. See [`../design-reference.md`](../design-reference.md).
- Production feedback uses flash/toast — `alert()` belongs only to the frozen prototype.

### Docs
- Update `docs/`, `CLAUDE.md`, and `README.md` in the **same change** as any feature/schema/route/
  convention change (drift is treated as a bug — risk R7).

---

## 6. Key Business Rules

| Rule | Where enforced |
|---|---|
| 2–10 options per poll | `StorePollRequest`/`UpdatePollRequest` |
| One active poll per creator (on launch) | `PollService` (D1) |
| Edit: owning creator or admin, only while **not active** (draft or ended) | `PollPolicy@update` |
| Launch: owning creator or admin | `PollPolicy@launch` |
| Delete: admin only | `PollPolicy` |
| Close/restart: owning creator or admin | `PollPolicy` |
| Add-time: admin only | route `role:admin` + policy |
| Vote only while active & before `ends_at` | `VoteService` / `Poll::hasExpired()` |
| One vote per `voter_key` (single-choice) | `Cache::lock` + DB unique index |
| Password-gated polls require unlock first | `PollController@unlock` + `Poll::isUnlocked()` (D9) |
| Tallies recompute from rows after vote/moderation | `VoteService` (D3) |
| Public id is the UUID; int id never exposed | `PollPresenter` + `getRouteKeyName()` (D15) |

### Poll status transitions
```
draft  → active   (launch)
active → ended    (close, or settleIfExpired / scheduled sweep when ends_at passes)
ended  → active   (restart — clears votes, new starts_at/ends_at)
```
Status enum is `draft | active | ended`. There is no `paused`/`archived` state.

---

## 7. Architecture Decisions (why this stack)

- **Inertia over a REST API + SPA (D5).** One Laravel app renders typed props into React pages;
  no token API, no client router, no separate state store. Removes a whole class of API/contract drift.
- **Reverb/Echo over polling.** Live tally/ticker/status push over WebSockets is already built; the
  public results page keeps a lightweight reload backstop only for when Reverb is unreachable (R6).
- **Derived tallies (D3).** Counts come from `COUNT(votes …)` (exposed via `withCount`), not a
  writable counter — correctness over premature denormalization. `polls.visits_count` is the one
  intentional denormalized counter (D17), and only for visit stats.
- **`voter_key` dedupe (D19).** A vote carries `user:{id}` / `email:{email}` / `token:{token}`;
  guests are not user accounts. No device-fingerprint/`voter_sessions` layer.
- **UUID public identity (D15).** `polls.uuid` is the route key and channel name; the bigint PK and
  all FKs stay integer for performance.

---

## 8. Real-time

| Event | Broadcast name | Payload | Channels |
|---|---|---|---|
| `VoteCast` | `.vote.cast` | `pollId`, `tally` | private + public `poll.{uuid}` |
| `VoterTicked` | `.voter.ticked` | `pollId`, `voter` | private + public `poll.{uuid}` |
| `PollStatusChanged` | `.poll.status` | `pollId`, `status`, `endsAt`, `remainingSeconds` | private + public `poll.{uuid}` |

`VoteCast` is coalesced to ~4/s per poll; `VoterTicked` is per-vote. Vote persistence must succeed
even if broadcasting fails. See [`../07-realtime.md`](../07-realtime.md).

---

## 9. Commands

```
composer dev        # server + queue + vite
npm run dev         # vite only
npm run build       # production frontend build
npm run lint        # ESLint --fix
npm run format      # Prettier over resources/
php artisan test    # Pest
```

---

## 10. Deployment

Forge/VPS target: web server + TLS, MySQL 8, Redis (cache/queue/locks/coalescing), Supervisor for
queue worker + Reverb + `schedule:run` (expired-poll auto-end). Production checklist: `APP_DEBUG=false`,
`APP_ENV=production`, `php artisan storage:link`, SSL auto-renew, DB not publicly exposed, `.env`
out of version control. Full plan: [`../09-execution-checklist.md`](../09-execution-checklist.md) Phase 6.

---

## 11. Document Index (this folder)

| Document | Purpose (realigned) |
|---|---|
| `comparison.md` | What to adopt vs. reject from the original QR-app spec |
| `PRD.md` | Product scope, adapted to the current stack/roles |
| `DATABASE_DESIGN.md` | Actual schema (users/polls/poll_options/votes, +poll_visits) |
| `API_DESIGN.md` | Inertia routes + the narrow operational endpoints (not REST) |
| `FRONTEND_ARCHITECTURE.md` | Inertia pages/layouts/hooks (no Router/Zustand/shadcn) |
| `SECURITY.md` | voter_key dedupe, rate limits, XSS/SQLi/CSRF, privacy |
| `USER_STORIES.md` | Stories by role (Admin / Poll Creator / Voter-guest) |
| `ROADMAP.md` | Remaining work, mapped to the execution checklist |
| `QA_TEST_PLAN.md` | Pest + manual + load test cases for this stack |

> The authoritative specs are the numbered docs in [`../`](../). When this folder and those
> disagree, the numbered docs win.
