# 09 - Execution Checklist

> The single ordered checklist for Vote Showdown. Legend: `[ ]` todo, `[~]` in progress, `[x]` done.
>
> **Audit baseline:** Updated from the current codebase on 2026-06-12. This update reconciles docs to implementation only; tests/builds were not rerun during the documentation update.

## Current Delivery State

- [x] Laravel 12 + Inertia v2 + React 19 production scaffold exists.
- [x] Original `src/` prototype is preserved as frozen design reference.
- [x] Production UI has moved to `resources/js/` and styling to `resources/css/app.css`.
- [x] Core poll lifecycle, voting, guest voting, QR sharing, countdown/deadline endings, password gates, option media fields, Reverb events, and scheduled auto-end are implemented.
- [~] Dashboard/admin surfaces are partially implemented: dashboard and controls exist; dedicated voter audit/settings surfaces still need product completion.
- [~] Realtime is implemented in code but still needs live multi-browser/Reverb/load verification.
- [ ] Magic-link / one-tap invitee voting remains pending; current low-friction voter path is public guest voting by email.
- [ ] CI, Forge/VPS deployment, Redis production hardening, accessibility pass, and final release smoke tests remain pending.
- [ ] New feature set scoped (not yet built): UUID poll URLs (5f), admin user management (5g), poll visit statistics (5h), admin vote moderation (5i), and image-upload hardening (Phase 5c). See decisions D15–D18 / D10a.

## Phase -1 - Repo Cleanup

- [x] Remove AI Studio artifacts that should not ship.
- [x] Replace AI Studio README with project README.
- [x] Keep `src/` as frozen design reference.
- [x] Document design reference in [`design-reference.md`](design-reference.md).
- [x] Drop prototype-only `@google/genai` dependency.
- [x] Replace prototype-only Vite assumptions with Laravel/Inertia scaffold assumptions.

## Phase 0 - Laravel/Inertia Scaffold

- [x] Scaffold Laravel 12 + React/Inertia/TypeScript starter at repo root.
- [x] Install and wire Inertia, Ziggy, Laravel Vite plugin, React 19, Tailwind v4, and Vite 6.
- [x] Install and configure Reverb/Echo client dependencies.
- [x] Flip `@/*` alias to `resources/js`.
- [x] Port prototype theme tokens to `resources/css/app.css`.
- [x] Add Laravel auth/settings starter pages.
- [x] Add Pest test framework.
- [~] Local dev orchestration exists through `composer dev`, but it currently runs Laravel server, queue listener, and Vite only; add Reverb and scheduler processes when live testing becomes the next focus.
- [ ] Re-run and record current `php artisan test`, `npm run build`, and TypeScript verification before the next implementation phase.

## Phase 1 - Data & Auth

- [x] Add `UserRole` and `PollStatus` PHP enums.
- [x] Add mirrored TypeScript model contracts in `resources/js/types/models.ts`.
- [x] Add users, polls, poll options, votes, guest, password, ending, and option media schema support.
- [x] Add models, relationships, casts, factories, and seeders.
- [x] Add Laravel auth flows from the starter kit.
- [x] Add role middleware and shared Inertia auth/flash context.
- [x] Add claimable guest user model via `users.is_guest`.
- [ ] Magic-link / one-tap invitee flow: signed temporary route, lightweight invitee account/session, direct landing on voting page.
- [ ] Finalize and document new-signup default-role policy.

## Phase 2 - Poll Management

- [x] Add `StorePollRequest` and `UpdatePollRequest`.
- [x] Enforce 2-10 options and countdown/deadline validation.
- [x] Add optional access password validation/storage.
- [x] Add option image/icon validation/storage fields.
- [x] Add `PollPolicy` for create, view, update, launch, delete, close, restart, and control.
- [x] Add `PollService::create`, `update`, `launch`, `close`, `addSeconds`, `restart`, and `settleIfExpired`.
- [x] Enforce one active poll per creator when launching.
- [x] Add poll index/create/show/edit/update/delete routes and pages.
- [x] Add shared poll form for create/edit.
- [x] Add admin-only delete; owner-or-admin edit/close/restart; admin-only add-time.
- [ ] Verify option image upload end to end with `php artisan storage:link` in the local environment.

## Phase 3 - Voting

- [x] Add authenticated vote request/controller path.
- [x] Enforce active poll and dedupe rules through policy/service checks.
- [x] Use atomic per-user-per-poll `Cache::lock` for single-choice race protection.
- [x] Derive tallies from the `votes` table.
- [x] Rate-limit authenticated vote endpoint.
- [x] Add password-gate enforcement before vote casting.
- [x] Add public guest vote request/controller path.
- [x] Reuse `VoteService::cast` for guest votes.
- [ ] Add or confirm tests for public password-protected guest voting.

## Phase 4 - Realtime

- [x] Add `VoteCast`, `VoterTicked`, and `PollStatusChanged` broadcast events.
- [x] Broadcast tally, ticker, and status to private authenticated channels.
- [x] Broadcast public poll events for guest/results pages.
- [x] Add `routes/channels.php` private poll channel authorization.
- [x] Add `usePollChannel`, `usePublicPollChannel`, and `useCountdown` hooks.
- [x] Coalesce tally broadcasts and keep per-vote ticker events.
- [x] Keep vote persistence tolerant of unreachable broadcasting.
- [ ] Verify socket-id forwarding prevents duplicate acting-user updates.
- [ ] Run live two-browser Reverb test for authenticated and public pages.
- [ ] Run burst/load test and tune coalescing window if needed.
- [ ] Confirm degraded/polling fallback behavior when Reverb is unavailable.

## Phase 5 - Dashboard, Admin & Analytics

- [x] Add role-aware `DashboardController`.
- [x] Add dashboard page with active poll, recent polls, and metrics props.
- [x] Add poll show page with live tally/results, voters, QR/share, and management controls.
- [x] Add close, add-time, and restart controls through `ShowControlController`.
- [x] Add scheduled auto-end sweeper in `routes/console.php`.
- [x] Replace production action feedback with flash/toast flow.
- [~] Metrics are real queries, but engagement-rate denominator is still a placeholder/open decision.
- [ ] Build dedicated voter audit/log page.
- [ ] Build product-specific settings/admin page, or explicitly retire the old prototype settings tab.
- [ ] Rate-limit control actions where needed beyond current route protection.
- [ ] Verify no production page still relies on prototype simulator behavior.

## Phase 5b - QR Voting & Public Sharing

- [x] Add `qrcode.react`.
- [x] Add public QR join route `GET /polls/{poll}/join`.
- [x] Add public voting page `GET /p/{poll}`.
- [x] Add public guest vote route `POST /p/{poll}/vote`.
- [x] Add public results page `GET /r/{poll}`.
- [x] Add QR/share component and public results QR flow.
- [x] Add public guest live updates through public poll channel.
- [x] Add returning guest `voted_poll_{id}` cookie.
- [ ] Decide whether `/polls/{poll}/join` should redirect to public guest voting or remain an auth-intended join route.

## Phase 5c - Passwords, End Modes, and Option Media

- [x] Add countdown and deadline end modes.
- [x] Resolve both end modes into authoritative `ends_at`.
- [x] Add optional poll access password and unlock route.
- [x] Expose password state through `PollPresenter`.
- [x] Add option image/icon schema, validation, service storage, and presenter fields.
- [ ] Verify option images render correctly across dashboard, show, public vote, and public results pages.

### Image upload hardening (D10a)

- [ ] Run/verify `php artisan storage:link` and confirm `Storage::url` renders saved images (current break: missing symlink + 2 MB cap silently rejecting normal photos).
- [ ] Raise option image cap from `max:2048` to `max:8192` in `StorePollRequest`/`UpdatePollRequest`.
- [ ] Add explicit `mimes:jpg,jpeg,png,webp` allowlist (exclude SVG) replacing the bare `image` rule.
- [ ] Store uploads via `storeAs` with a random filename (no enumeration).
- [ ] Surface per-option image validation errors (`errors['options.N.image']`) in `PollForm`.
- [ ] Confirm PHP `upload_max_filesize` / `post_max_size` are large enough for the new cap.

## Phase 5f - UUID Public Poll URLs (D15)

- [ ] Add `polls.uuid` (unique, indexed) migration + backfill of existing rows.
- [ ] Auto-generate `uuid` on poll creation (model boot hook); set `getRouteKeyName() => 'uuid'`.
- [ ] Confirm route-model binding resolves `/p/{poll}`, `/r/{poll}`, `/polls/{poll}`, join/unlock/control by uuid.
- [ ] Switch broadcast channel naming to `poll.{uuid}` in `routes/channels.php` and the Echo hooks.
- [ ] Expose `uuid` as the poll's public id in `PollPresenter`; update `resources/js/types/models.ts` (`id: number → string`).
- [ ] Update factories/seeders to generate uuids; verify QR/share links emit uuid URLs.
- [ ] Pest: poll resolves by uuid, sequential int id is never exposed in props/URLs.

## Phase 5g - Admin User Management (D16)

- [ ] Add resourceful `admin/users` routes (index/create/store/edit/update/destroy) under `role:admin`.
- [ ] Add `Admin\UserController` (thin), `StoreUserRequest`/`UpdateUserRequest` (role validated against `UserRole`, unique email, password rules).
- [ ] Add `UserPolicy` (admin-only) and register it.
- [ ] Safeguards: block self-demotion, block deleting yourself, block removing the last admin.
- [ ] Set privilege fields (`role`) only through this audited path (addresses mass-assignment audit finding).
- [ ] Add `pages/admin/users/{index,create,edit}.tsx` in brutalist style; show sidebar link to admins only.
- [ ] Pest: non-admins get 403; admin can CRUD; last-admin/self-demotion guards hold.

## Phase 5h - Poll Visit Statistics (D17)

- [ ] Add `poll_visits` migration and `polls.visits_count` column.
- [ ] Add `PollVisit` model and `PollVisitService::record(poll, request)` with one-per-session-per-poll dedupe and salted IP hash.
- [ ] Record visits on authed `show`, public `show`, and public `results`.
- [ ] Surface visit stats (total, unique, visit→vote conversion) in admin dashboard/poll list — backend only, no public UI.
- [ ] Pest: a visit is recorded once per session; counter increments; no raw IP stored.

## Phase 5i - Admin Vote Moderation (D18)

- [ ] Add `DELETE polls/{poll}/voters/{user}/votes` route (auth + admin).
- [ ] Add `PollPolicy::deleteVotes` (admin-only) and `VoteService::deleteForVoter(poll, user)`.
- [ ] Add `VoteController::destroyForVoter` (thin); recompute-derived tallies and rebroadcast tally/status after delete.
- [ ] Add admin-only delete control + confirmation modal to the `polls/show` voter list; flash toast on success.
- [ ] Pest: non-admin 403; admin delete removes the voter's votes and tally reflects the change.

## Phase 5d - Roles and Guest Parity

- [x] Allow any authenticated user to create polls.
- [x] Allow owner/admin editing.
- [x] Restrict delete to admin.
- [x] Allow owner/admin close and restart.
- [x] Keep add-time admin-only.
- [x] Redesign guest page to mirror the authenticated poll experience without sidebar.
- [ ] Reconcile docs/product language around "invitee", "guest", and future magic-link accounts.

## Phase 5e - Theme Polish

- [x] Force light-only theme.
- [x] Set brand primary/ring colors.
- [x] Restyle login/register/welcome with brutalist treatment.
- [x] Add sidebar links to profile/password settings.
- [ ] Perform accessibility pass for keyboard navigation, labels, contrast, and focus states.

## Phase 6 - Hardening & Deploy

- [ ] Re-run full Pest suite and record current passing count.
- [ ] Run `npm run build`.
- [ ] Run TypeScript verification or confirm build covers TS strictness.
- [ ] Run lint/format checks.
- [ ] Add enum-contract drift test as CI gate.
- [ ] Wire CI gates for PHP tests, frontend build, TypeScript, lint/format, and drift tests.
- [ ] Verify rate limits on vote, public vote, poll creation, QR join, unlock, and control routes.
- [ ] Configure production Redis for queue/cache/locks/coalescing.
- [ ] Configure Forge/VPS, Supervisor, queue worker, Reverb, scheduler, TLS, and MySQL 8.
- [ ] Run staging smoke test for auth, public voting, QR, password-gated polls, live Reverb, and scheduled expiry.
- [ ] Verify rollback path.

## Open Decisions

- [ ] Engagement-rate denominator and final dashboard metric formulas.
- [ ] New-signup default role and elevation policy.
- [ ] Magic-link account model versus current claimable guest account model.
- [ ] Whether private/invite-only polls are in scope.
- [ ] Public QR join target: `/polls/{poll}/join` auth-intended route versus `/p/{poll}` direct guest route.
- [ ] Production coalescing window after Reverb load test.

## Cross-Cutting Guardrails

- [ ] Authorization enforced server-side through policies/middleware.
- [ ] Inputs validated in FormRequests.
- [ ] Tallies derived from DB rows, never trusted from client state.
- [ ] No production feature depends on mock/prototype simulator state.
- [ ] Flash/toast for production feedback; no new production `alert()` calls.
- [ ] Docs updated in the same change as feature/schema/route/convention changes.
- [ ] Design stays aligned to [`design-reference.md`](design-reference.md) and the frozen `src/` prototype.
