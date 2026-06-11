# Module · Public Sharing & Guest Voting

> Vertical slice. Part of the [source of truth](../README.md). Realizes the magic-link/quick-account intent (D2) and ports the prototype's email-to-vote `InviteeView`. Related: [qr-voting.md](qr-voting.md), [voting.md](voting.md), [`../06-auth-and-roles.md`](../06-auth-and-roles.md).

## Responsibility

Every poll has a **shareable public link**. Opening it shows a **guest page with no sidebar** — anyone can view the poll and its live tally **without logging in** (decision D8). A guest can **vote by entering their email**; the first vote silently creates a lightweight, claimable `invitee` account keyed by that email, so "one identity = one vote" still holds. This is the frictionless scan-and-vote path the QR points at.

## Decisions (D8)

- **Public view, no auth.** The guest page renders for anyone with the link. No sidebar, no session required.
- **Guest vote → quick account.** Voting asks for an email (+ optional display name). The backend finds-or-creates an `invitee` user flagged `is_guest = true` (no password, **claimable** later by setting one). The vote is attributed to that user; dedupe is per user, so the same email can't double-vote a single-choice poll.
- **QR & "Share" both target this page** (`/p/{poll}`), replacing the earlier login-gated `polls.join` as the primary audience entry. `polls.join` stays for authed deep-linking.
- **Realtime for guests = polling.** The live tally channel is private (needs auth); guests can't subscribe. The guest page therefore **polls** (Inertia partial reload every few seconds) for a near-live tally. A public broadcast channel is a future enhancement — keep the authed page on Echo.

## Data `[new]`

- `users.is_guest` boolean (default false), indexed. Distinguishes claimable guest accounts from full registrations. Combined with the existing `is_demo`, the user table cleanly separates real / demo / guest identities. A guest "claims" their account by registering/setting a password with the same email (flip `is_guest = false`).

## Backend `[new]`

- **Routes (public, no `auth`, rate-limited):**
  - `GET /p/{poll}` → `PublicPollController@show` — name `public-poll.show`. The shareable link.
  - `POST /p/{poll}/vote` → `PublicPollController@vote` — name `public-poll.vote`. `throttle` per IP.
- **`PublicPollController@show`** renders Inertia `public-poll` with the poll + tally + recent voters (same `PollPresenter`, but `hasVoted` resolved from a guest cookie if present).
- **`PublicPollController@vote`** validates `{poll_option_id, email, name?}` (`StoreGuestVoteRequest`), resolves the guest user, then reuses `VoteService::cast` (so the R2 `Cache::lock` dedupe, tally, and broadcasts all apply unchanged):
  ```php
  $user = User::firstOrCreate(
      ['email' => $request->email],
      ['name' => $request->name ?: Str::before($request->email, '@'),
       'role' => UserRole::Invitee, 'is_guest' => true,
       'password' => Hash::make(Str::random(32)),
       'avatar_text' => /* initials */, 'avatar_bg_color' => /* palette */],
  );
  // Pre-check active + not-already-voted for a clean message, then:
  $this->votes->cast($user, $poll, $optionId);
  ```
  Optionally drop a signed cookie (`voted_poll_{id}` / a guest token) so a returning guest sees their "already voted" state without re-entering email.
- **Abuse note (risk R5):** the public vote endpoint is open; dedupe is per email, so a determined user could vote with many emails. Acceptable for the demo; add a captcha / per-IP cap later. Rate-limit now.

## Frontend `[new]`

- **`layouts/guest-layout.tsx`** — sidebar-less brutalist shell: a slim top bar (logo + "VOTE! SHOWDOWN") and the `FlashToast`. Used by the public page only. Mirrors the prototype's `InviteeView` chrome (no admin sidebar).
- **`pages/public-poll.tsx`** — ports `InviteeView`: poll title/description, option choice cards, an **email field + "Cast my vote!"**, and a live leaderboard/tally. Uses **polling** (`router.reload({ only: ['poll'] })` on an interval) for liveness; shows a "✓ voted" state after submit (and on return via cookie). No Echo.
- **Inline QR + share, not a modal.** `components/showdown/qr-share.tsx` renders the QR + copyable share link as an inline card (the QR **always encodes the vote URL** `route('public-poll.show', poll)`). It sits in the side column of the backend poll page and on the side of both guest pages.
- **Two public links per poll:**
  - **Vote** — `GET /p/{poll}` (`public-poll.show`): the guest voting page, QR on the side.
  - **Results-only** — `GET /r/{poll}` (`public-poll.results`): a read-only spectator/projection page (live tally + winner) that shows a **QR linking to the vote page**. No voting form. Page `pages/public-results.tsx`.
- The backend poll page exposes both (QR-share for the vote link + an "Open results view" button).

## Acceptance criteria

- [ ] A logged-out visitor can open `/p/{poll}` and see the poll + tally — **no sidebar, no login**.
- [ ] A guest votes by entering an email; a claimable `is_guest` invitee is created and the vote is recorded once.
- [ ] Same email cannot double-vote a single-choice poll (R2 lock via `VoteService`).
- [ ] The guest tally updates without a manual refresh (polling).
- [ ] QR and the share link both point at `/p/{poll}`; scanning a phone lands on the guest page and can vote directly.
- [ ] A guest can later register with the same email to claim the account (`is_guest → false`).
- [ ] Public vote endpoint is rate-limited.
