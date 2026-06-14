# 05 - Frontend (Inertia v2 + React 19 + TS)

> Part of the [Vote Showdown source of truth](README.md). Prototype components live in `src/` as frozen design reference; production UI lives in `resources/js/`.

## Frontend Baseline

The production frontend is an Inertia React app. Laravel routes/controllers choose page components and pass typed props; React owns local UI state only. Domain mutations go through Inertia form submissions or router actions, and live updates arrive through Echo/Reverb hooks.

The old prototype `src/App.tsx` remains useful only as a design and interaction reference. Its stateful handlers now map to Laravel controllers/services.

## Entry

- `resources/js/app.tsx` - Inertia `createInertiaApp` entry.
- `resources/css/app.css` - Tailwind v4 theme and brutalist styling tokens.
- `resources/js/types/models.ts` - TypeScript read-model contract matching PHP presenters/events.
- `resources/js/lib/utils.ts` - shared frontend utilities.

## Type Contract

`resources/js/types/models.ts` currently includes:

- `PollStatus = 'draft' | 'active' | 'ended'`
- `PollEndMode = 'duration' | 'deadline'`
- `PollOption` with `colorClass`, `badgeColorClass`, `imageUrl`, `icon`, `position`, and server-derived `count`
- `Poll` with `requiresPassword`, `unlocked`, `endMode`, `durationSeconds`, `deadlineAt`, `endsAt`, `remainingSeconds`, `totalVotes`, `hasVoted`, and `options`
- `VoterEntry`
- `PollMetrics`
- Realtime payloads for vote tally, voter ticker, and poll status

Keep this file synchronized with `app/Enums/*`, `app/Support/PollPresenter.php`, and `app/Events/*::broadcastWith()`.

## Pages

Current active Inertia pages:

| Page | Responsibility |
|------|----------------|
| `pages/welcome.tsx` | Public landing/auth entry with brutalist styling |
| `pages/dashboard.tsx` | Role-aware dashboard with active poll, recent polls, and metrics |
| `pages/polls/index.tsx` | Poll list and poll entry points |
| `pages/polls/create.tsx` | Create/launch poll using shared poll form |
| `pages/polls/edit.tsx` | Edit poll setup using shared poll form |
| `pages/polls/show.tsx` | Authenticated poll show/results/voting/control surface |
| `pages/public-poll.tsx` | Public no-login guest voting page |
| `pages/public-results.tsx` | Public spectator/results page with QR back to voting |
| `pages/auth/*` | Starter auth flows, restyled for the brand |
| `pages/settings/*` | Starter profile/password/appearance pages |

Planned/not yet complete:

- Dedicated voter audit/log page.
- Product-specific show/settings page, or explicit retirement of the prototype settings tab.
- Magic-link vote landing page if the final D2 flow needs a distinct UI.

## Layouts

- `layouts/showdown-layout.tsx` - primary authenticated showdown shell.
- `layouts/guest-layout.tsx` - sidebar-less public voting/results shell.
- `layouts/app-layout.tsx` and nested `layouts/app/*` - starter shell support.
- `layouts/auth/*` - restyled auth layouts.
- `layouts/settings/layout.tsx` - settings shell.

## Components

Current showdown components:

- `components/showdown/poll-form.tsx` - shared create/edit poll form.
- `components/showdown/qr-share.tsx` - QR/share panel for vote/results links.
- `components/showdown/countdown-badge.tsx` - display countdown from server `endsAt`.
- `components/showdown/option-badge.tsx` - option icon/image/badge rendering.
- `components/showdown/flash-toast.tsx` - flash/toast feedback replacing production `alert()`.

Shared UI components live under `resources/js/components/ui/`, based on the starter/Radix-style component set.

## Hooks

- `use-countdown.ts` - local display countdown over server-authoritative `endsAt`.
- `use-poll-channel.ts` - authenticated/private poll channel listener.
- `use-public-poll-channel.ts` - public poll channel listener for guest/results pages.
- `use-appearance.tsx` - currently forced light-only theme behavior.

## Prototype Logic Mapping

| Prototype behavior | Production home |
|---|---|
| Cast vote | `VoteController@store`, `PublicPollController@vote`, `VoteService::cast` |
| Create/launch poll | `PollController@store`, `PollService::create`, `PollService::launch` |
| Edit poll | `PollController@edit/update`, `PollService::update` |
| Close poll | `ShowControlController@close`, `PollService::close` |
| Restart poll | `ShowControlController@restart`, `PollService::restart` |
| Add time | `ShowControlController@addSeconds`, `PollService::addSeconds` |
| Countdown | `useCountdown` display plus `polls.ends_at` server truth |
| Fake simulator | Removed from production; real votes broadcast through Reverb |
| `alert()` | Production flash/toast |

## Remaining Frontend Work

- [ ] Verify all current pages against the frozen `src/` design reference.
- [ ] Finish dedicated voter audit/log UI if still part of product scope.
- [ ] Decide whether the old settings tab becomes product settings or is retired.
- [ ] Complete accessibility pass.
- [ ] Verify public and authenticated Reverb behavior in real browsers.
- [ ] Confirm option images/icons render correctly everywhere.
