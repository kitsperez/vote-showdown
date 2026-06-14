# 02 - System Architecture

> Part of the [Vote Showdown source of truth](README.md).

## Big Picture

Vote Showdown is a Laravel/Inertia application:

- Laravel owns routing, validation, authorization, persistence, scheduling, and broadcasting.
- Inertia renders React pages from server-provided props.
- MySQL stores users, polls, options, and votes.
- Reverb/Echo pushes live vote, ticker, and poll-status changes.
- The old `src/` prototype is retained only as frozen visual/design reference.

## Request Flow

Typical page:

```text
Browser -> Laravel route -> middleware -> controller -> policy/service/query -> Inertia::render -> React page
```

Typical mutation:

```text
React form/router -> Laravel route -> FormRequest -> Policy -> Service -> DB write -> flash redirect -> optional broadcast
```

Voting uses this flow through either:

- Authenticated route: `POST /polls/{poll}/votes`.
- Public guest route: `POST /p/{poll}/vote`.

## Production Directory Layout

```text
app/
  Enums/                  UserRole, PollStatus
  Events/                 VoteCast, VoterTicked, PollStatusChanged
  Http/
    Controllers/          Dashboard, Poll, PublicPoll, Vote, Admin controls, Auth, Settings
    Middleware/           HandleInertiaRequests, EnsureUserHasRole
    Requests/             Store/Update poll, vote, guest vote, auth/settings requests
  Models/                 User, Poll, PollOption, Vote
  Policies/               PollPolicy
  Services/               PollService, VoteService
  Support/                PollPresenter
database/
  migrations/             users/cache/jobs plus polls/options/votes/guest/password/ending/media fields
  factories/              User, Poll, PollOption, Vote
  seeders/                UserSeeder, DefaultPollsSeeder
resources/
  css/app.css             Tailwind v4 theme and brutalist tokens
  js/
    app.tsx               Inertia entry
    components/           app shell, UI primitives, showdown components
    hooks/                countdown, private/public poll channels, appearance/mobile helpers
    layouts/              app/auth/guest/settings/showdown layouts
    pages/                dashboard, auth, settings, polls, public poll/results, welcome
    types/                model/event contracts
routes/
  web.php                 Inertia, public, voting, QR, control routes
  auth.php                auth routes
  settings.php            settings routes
  channels.php            broadcast channel auth
  console.php             scheduled auto-end
src/                      frozen prototype reference only
tests/                    Pest unit/feature tests
```

## Conventions

- `@/*` maps to `resources/js`.
- `src/` is not on the production import path.
- Controllers stay thin; FormRequests validate, Policies authorize, Services mutate.
- Counts/tallies are derived from DB rows.
- Inertia props use camelCase through presenter/controller mapping.
- Production feedback uses flash/toast, not `alert()`.
- Realtime events should not be required for successful writes; failed broadcasting must not break voting.

## Local Tooling

Current scripts:

- `composer dev` runs Laravel server, queue listener, and Vite.
- `npm run dev` runs Vite only.
- `php artisan test` runs Pest.
- `npm run build` builds frontend assets.
- `npm run lint` runs ESLint with auto-fix.
- `npm run format` formats `resources/`.

Known tooling gap:

- Add Reverb and scheduler processes to the local orchestration when live realtime testing is the next focus.

## Production Topology

Target production remains Forge/VPS:

- Web server with TLS.
- MySQL 8.
- Redis for cache/queue/locks/coalescing in production.
- Supervisor for queue worker, Reverb, and scheduler.
- `php artisan schedule:run` for expired-poll auto-end.
- CI gates before deployment.

## Open Architecture Decisions

- Whether magic-link voting wraps or replaces public guest voting.
- Whether QR canonical target is `/p/{poll}` or `/polls/{poll}/join`.
- Whether private/invite-only polls are in scope.
- Final dashboard engagement-rate formula.
