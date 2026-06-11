# 09 · Execution Checklist

> The single, ordered, do-this-next list for building Vote Showdown. Each item links to its spec. Hardening fixes (risk IDs `R1–R8`, `H/M`) are embedded at the phase where they land. Gate each phase on its **Exit criteria** before moving on. Don't start an item that fails the [Definition of Ready](08-delivery-plan.md#definition-of-ready-a-ticket-may-start-only-if).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## Phase −1 · Repo cleanup ✅ (done)

- [x] Remove `assets/` (AI Studio `.aistudio` artifact)
- [x] Remove `metadata.json` (AI Studio applet manifest)
- [x] Remove `.env.example` (Gemini/AI Studio env — Laravel will regenerate)
- [x] Replace AI Studio `README.md` with a real project README
- [x] Confirm `src/` is **kept** as frozen design reference ([`design-reference.md`](design-reference.md))
- [ ] Decide: lock these plans (this checklist) before any code — **you are here**

> Deferred to Phase 0 (these files are still useful references until then): drop `@google/genai` from `package.json`, remove the `DISABLE_HMR` block from `vite.config.ts`, replace `index.html` with Laravel's Blade entry.

---

## Phase 0 · Scaffold `[infra]` — spec: [`02-architecture.md`](02-architecture.md)

Strategy: **fresh Laravel skeleton on a branch, then port** — never install Laravel over the existing root (risk R4).

- [ ] Create branch `feat/laravel-scaffold`
- [ ] Scaffold **Laravel 12 + React/Inertia/TS starter** in a clean skeleton
- [ ] Copy `src/` into the repo as frozen reference; port code into `resources/js`
- [ ] Merge `package.json`: keep `lucide-react`, `motion`, `tailwindcss`; **drop `@google/genai`**
- [ ] Merge Vite config (laravel-vite-plugin + React + Tailwind v4); **remove `DISABLE_HMR` block**
- [ ] Port `src/index.css` `@theme` (Quicksand / Space Mono) → `resources/css/app.css`
- [ ] **Flip `@` alias → `resources/js` in `tsconfig.json` + `vite.config.ts` together** (risk M2)
- [ ] Install & wire **Ziggy** so `route()` works in TS (risk H1)
- [ ] Install broadcasting + Echo (`php artisan install:broadcasting`); add **socket-id axios interceptor** (risk R3)
- [ ] Configure MySQL `.env` (`DB_*`); set `BROADCAST_CONNECTION=reverb`, `QUEUE_CONNECTION=database`, `REVERB_*`, `VITE_REVERB_*`
- [ ] Add `composer dev` orchestrator: serve + vite + `reverb:start` + `queue:work` + `schedule:work` (5 processes)
- [ ] **Exit:** `npm run build`, `tsc --noEmit`, and `php artisan test` all green; app boots; a trivial Inertia page renders

---

## Phase 1 · Data & Auth `[new]` — spec: [`03-database.md`](03-database.md), [`06-auth-and-roles.md`](06-auth-and-roles.md)

- [ ] Enums: `UserRole`, `PollStatus` (+ mirror TS unions in `resources/js/types/models.ts`)
- [ ] Migrations (in FK order): `users` (+`role`, `avatar_*`, **`is_demo`** R3/M1), `polls`, `poll_options`, `votes` (with `UNIQUE(poll_id, poll_option_id, user_id)`)
- [ ] Models + relations + casts (`User`, `Poll`, `PollOption`, `Vote`); `Poll::isActive/hasExpired/remainingSeconds` (**Carbon-3-safe**, risk R8)
- [ ] Factories with role/status states
- [ ] Seeders: `UserSeeder` (one per role), `DefaultPollsSeeder` (ports `src/data.ts`; demo voters tagged `is_demo`, local/staging only — M1)
- [ ] Auth via starter kit (login/register/verify/reset)
- [ ] `EnsureUserHasRole` middleware + alias
- [ ] **Magic-link / one-tap voting** flow (signed temporary route → lightweight invitee account → Vote page) (decision D2)
- [ ] `HandleInertiaRequests` shares `auth.user` + `flash`
- [ ] **Decide (open):** new-signup default-role policy; magic-link account model (full row vs claimable guest)
- [ ] **Exit:** each role can log in; role middleware blocks the wrong role (403); magic link logs in an invitee and lands them on a Vote page

---

## Phase 2 · Poll Management `[new]` — spec: [`modules/poll-management.md`](modules/poll-management.md)

- [ ] `StorePollRequest` (2–10 options; duration in {45,90,120,180})
- [ ] `PollPolicy` (`create`/`update`/`launch`/`delete`/`control`)
- [ ] `PollService::create` (transactional poll+options)
- [ ] `PollService::launch` — ends only the **same creator's** active poll (decision D1); sets `ends_at`; fires `PollStatusChanged`
- [ ] `PollService::close` / `restart` (restart deletes votes in a transaction)
- [ ] `PollController` (`index`/`create`/`store`/`show`/`update`/`destroy`) + routes
- [ ] Rate-limit poll creation (risk M4)
- [ ] Pages: `Polls/Create` (port `PollCreatorView`), `Polls/Index`; `ShowrunnerLayout` (port sidebar/header)
- [ ] **Exit:** creator builds+launches a draft; launching ends only their own prior active poll; non-owner gets 403; option colors round-trip

---

## Phase 3 · Voting `[new]` — spec: [`modules/voting.md`](modules/voting.md)

- [ ] `StoreVoteRequest` + `VotePolicy::cast` (active poll; not already voted per rules)
- [ ] `VoteService::cast` with **atomic `Cache::lock` per user+poll** (fixes single-choice race, risk R2)
- [ ] `VoteService::tally` (derived counts via `withCount`)
- [ ] `VoteController::store` (authorize → service → `back()->with('success')`); `throttle:votes`
- [ ] Page: `Vote` (port `InviteeView`); `useForm` POST; `hasVoted` state
- [ ] **Exit:** vote persists & increments tally; concurrent different-option single-choice votes rejected (lock holds); voting a draft/ended/expired poll rejected; multi-choice same-option rejected

---

## Phase 4 · Real-time `[new]` — spec: [`07-realtime.md`](07-realtime.md)

- [ ] `php artisan reverb:start` running; channel auth in `routes/channels.php`
- [ ] Events: `VoteCast` (tally only) + `VoterTicked` (per-vote) + `PollStatusChanged`
- [ ] `VoteService::broadcastTally` — **coalesce tally ≤4/s, ticker per-vote** (risk R1); all use `->toOthers()`
- [ ] Verify socket-id forwarding makes acting voter's tally move **exactly once** (risk R3)
- [ ] Hooks: `usePollChannel` (tally/ticker/status), `useCountdown` (display over server `ends_at`)
- [ ] **Degraded mode:** Echo-down → poll fallback `router.reload({ only: [...] })` (risk R6)
- [ ] Delete the prototype simulator logic entirely
- [ ] **Exit:** two browsers see live tally + ticker; load test (staging) holds under burst votes; killing Reverb falls back to polling

---

## Phase 5 · Dashboard, Admin & Analytics `[new]` — spec: [`modules/dashboard-and-analytics.md`](modules/dashboard-and-analytics.md), [`modules/admin-controls.md`](modules/admin-controls.md)

- [ ] Metrics service: `totalVoters`, `velocityPerMinute`, `engagementRate` (**decide denominator** — open item)
- [ ] `DashboardController` (role-aware: creator overview / admin Showrunner panel)
- [ ] Pages: `Dashboard` (port `AdminDashboard`), `Polls/Show` (port `ResultsTally` — winner, bento, confetti, voter feed)
- [ ] `Admin/ShowControlController` (`close`/`addSeconds`/`restart`) — admin-only; rate-limited
- [ ] `Admin/Voters` page (paginated audit log); `Settings` page
- [ ] **Scheduled sweeper** auto-ends expired active polls + broadcasts (risk R8 boundary)
- [ ] Replace every `alert()` with flash → `Toast`
- [ ] **Exit:** metrics are real (not random); controls work live for admins only; expired polls auto-flip to results; no `alert()` remains

---

## Phase 6 · Hardening & Deploy `[infra]` — spec: [`08-delivery-plan.md`](08-delivery-plan.md)

- [ ] Pest coverage per module acceptance criteria (create/launch/vote/dedupe/authz)
- [ ] **Enum-contract drift test** (PHP enums == TS unions) as a CI gate (risk M5)
- [ ] Rate limits verified on votes, poll creation, control actions, magic-link issuance (risk R4/R5)
- [ ] Accessibility pass (keyboard nav, contrast, labels)
- [ ] CI gates wired: `php artisan test` · `npm run build` · `tsc --noEmit` · drift test
- [ ] **Forge + VPS** provisioning (decision D4): Supervisor for `reverb:start`/`queue:work`/scheduler; Redis; `wss://` TLS; MySQL 8 (risk R6)
- [ ] Staging smoke test of broadcasting over real WS; rollback verified
- [ ] **Exit:** green CI; staging mirrors prod; one-click rollback works → production go-live

---

## Cross-cutting guardrails (apply on every ticket)

- [ ] Authorization enforced **server-side** (policy/role), not just hidden in UI
- [ ] Inputs validated in a FormRequest; never trust client-sent counts/state
- [ ] No `alert()`, no leftover mock/simulator for the touched feature
- [ ] Update the relevant `docs/` if the contract (enums/types/routes) changes
- [ ] Keep the **cartoony Neo-Brutalist** look sourced from the matching `src/` file ([`design-reference.md`](design-reference.md))

## Open decisions to close (owners in [`08-delivery-plan.md`](08-delivery-plan.md))

- [ ] Engagement-rate denominator (by Phase 5)
- [ ] New-signup default-role policy (by Phase 1)
- [ ] Magic-link account model: full row vs claimable guest (by Phase 1/3)
- [ ] Tally-coalescing window tuning (by Phase 4 load test)
- [ ] Private/invite-only polls? (would tighten channel auth + Vote access)
