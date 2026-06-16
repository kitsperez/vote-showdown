# QA Test Plan
# Vote Showdown

> **Realigned to the source of truth.** Rewritten for the actual stack: assertions target
> **Inertia** responses/redirects/flash/props (not REST/JSON), the **`voter_key`** dedupe model,
> **UUID** routes, and **Reverb**. Automated tests use **Pest**; browser/realtime checks are manual;
> load testing uses an external tool (k6) driven by the `load-test-agent` (not added to the stack).
> The `qa-test-plan-agent` (`.claude/agents/`) can regenerate this catalog against current code.

---

## 1. Test Types

| Type | Tool | Who |
|---|---|---|
| Feature tests (HTTP/Inertia) | Pest | Developer |
| Unit tests (services/logic) | Pest | Developer |
| Frontend verification | ESLint + TypeScript via `npm run build` | Developer |
| Manual QA (browser, realtime, QR) | Browser / device | Dev / QA |
| Load testing | k6 (external CLI) via `load-test-agent` | Dev |

> No Vitest/Playwright in the current stack. Component-level coverage is via build/type-checking and
> manual QA until a frontend test runner is explicitly adopted.

---

## 2. Authentication & Roles

- **TC-AUTH-01** Valid login lands on the dashboard (Inertia redirect + auth prop set).
- **TC-AUTH-02** Invalid password is rejected (errors bag), no session established.
- **TC-AUTH-03** Password reset flow issues and consumes a reset token.
- **TC-AUTH-04** Auth routes are rate-limited (429 past threshold).
- **TC-PERM-01** Non-admin gets 403 on admin-only routes (delete, add-time, `admin/users`).
- **TC-PERM-02** Non-owner non-admin cannot edit/close/restart another creator's poll (403).
- **TC-PERM-03** New registration defaults to role `creator`.
- **TC-PERM-04 (D16)** Self-demotion, self-deletion, and last-admin removal are blocked; `role` is
  validated against the enum.

## 3. Poll Management

- **TC-POLL-01** Create single-choice poll with 3 options → persisted, status `draft`, a UUID assigned.
- **TC-POLL-02** Create multiple-choice poll (`allow_multiple = true`) succeeds.
- **TC-POLL-03** 1 option → 422 (errors bag); **TC-POLL-04** 11 options → 422.
- **TC-POLL-05** Empty title → 422.
- **TC-POLL-06** Launch sets `status=active`, `starts_at`, and resolves `ends_at` (duration or deadline).
- **TC-POLL-07** Launching a second poll enforces one-active-poll-per-creator (D1).
- **TC-POLL-08** Edit by owner/admin updates fields; options edit-in-place when votes exist.
- **TC-POLL-09** Delete (admin) cascades options + votes.
- **TC-UUID-01** Public URLs, QR/share, and channel names use the UUID; the integer id never appears
  in props or URLs (D15).

## 4. Poll Lifecycle

- **TC-LIFECYCLE-01** Close moves `active → ended`, sets `ends_at`, broadcasts `.poll.status`.
- **TC-LIFECYCLE-02** Restart clears all votes, sets new `starts_at`/`ends_at`, status `active`.
- **TC-LIFECYCLE-03** Add-time (admin) extends `ends_at`.
- **TC-LIFECYCLE-04** Vote on a `draft`/`ended` poll is rejected.
- **TC-SCHED-01** A poll whose `ends_at` has passed is settled to `ended` by `settleIfExpired` on read.
- **TC-SCHED-02** The scheduled sweeper in `routes/console.php` ends expired polls without a request.

## 5. Voting & Dedupe

- **TC-VOTE-01** Authed single-choice vote is accepted; tally (derived) increments.
- **TC-VOTE-02** Multiple-choice vote records one row per selected option.
- **TC-VOTE-03** Option from another poll is rejected (422).
- **TC-DEDUPE-01** Second vote with the same `voter_key` is rejected (single-choice).
- **TC-DEDUPE-02** Same email and same device-token paths both dedupe.
- **TC-DEDUPE-03 (R2)** Concurrent/burst votes for one `voter_key` persist **exactly one** vote
  (`Cache::lock` + unique index).
- **TC-DEDUPE-04** After a restart, the same voter can vote again (round cookie + wiped votes).
- **TC-TALLY-01** Tally always equals `COUNT(votes)`; client-sent counts are ignored (D3).
- **TC-RATE-01** Authed and guest vote endpoints return 429 past their limits.

## 6. Public / Guest / QR

- **TC-GUEST-01** `/p/{uuid}` renders for a logged-out user; guest can vote by email.
- **TC-GUEST-02** Returning guest sees voted state via `voted_poll_{uuid}` cookie; server dedupe still authoritative.
- **TC-GUEST-03** `/r/{uuid}` results page renders without login and lists recent voters even after the poll ends.
- **TC-PASSWORD-01** Gated poll rejects votes until unlocked; **TC-PASSWORD-02** wrong password rejected at `unlock`.
- **TC-QR-01** QR encodes the public UUID URL and lands on the correct poll.

## 7. Real-time (manual — pending verification)

- **TC-REALTIME-01** Two-browser authed test: a vote pushes `.vote.cast` tally + `.voter.ticked` to the other client.
- **TC-REALTIME-02** Two-browser public guest/results test over the public channel.
- **TC-REALTIME-03** Acting voter does not see duplicate movement (socket-id / `toOthers()`), risk R3.
- **TC-REALTIME-04** Status change broadcasts and updates spectators (`.poll.status`).
- **TC-REALTIME-05 (R6)** With Reverb killed, votes still persist; the results page falls back to its reload backstop.

## 8. Option Media (D10 / D10a)

- **TC-MEDIA-01** Upload validates MIME allowlist + size cap; oversize/disallowed → surfaced `errors['options.N.image']`.
- **TC-MEDIA-02** With `storage:link`, `Storage::url` renders the image across show/public/results.

## 9. Security

- **TC-SEC-01** XSS payload in title/option label is stored verbatim and rendered escaped (no execution).
- **TC-SEC-02** SQL-injection-style UUID/input causes a 404/validation error, no DB error or data loss.
- **TC-SEC-03** Non-owner cannot read/mutate another creator's poll controls (403).
- **TC-SEC-04** Visit records (D17) store only a salted IP hash, never a raw IP.

## 10. Load (external k6 — see load-test-agent)

- **Scenario vote-storm** — N concurrent guests vote; p95 < 500 ms, 5xx < 1% at target concurrency.
- **Scenario exactly-once-burst** — M simultaneous votes share one `voter_key` → exactly one persists (R2).
- **Scenario results-read-fanout** — heavy `/r/{uuid}` + `/p/{uuid}` polling; results p95 < 300 ms (D3 evidence).
- **Scenario reverb-subscribers** — K WebSocket clients on `poll.{uuid}`; broadcast latency + Reverb CPU/connections (R1/R3).

## 11. Mobile & Browser

Voter flow on Chrome/Android, Safari/iOS, Chrome/iOS; full authed flow on desktop Chrome and Safari/macOS.
QR scan on iOS and Android.

## 12. Pre-Release Checklist (feeds the Release Gates)

- [ ] `php artisan test` green; passing count recorded.
- [ ] `npm run build` green; lint/format clean.
- [ ] Enum/type drift check passes (PHP enums ↔ `types/models.ts`).
- [ ] All TC-VOTE / TC-DEDUPE / TC-PASSWORD / TC-PERM pass.
- [ ] Manual two-browser Reverb test passes (authed + public).
- [ ] Public guest + password-gated voting verified.
- [ ] Load scenarios meet thresholds; coalescing window tuned (R1).
- [ ] Accessibility pass completed.
- [ ] `APP_DEBUG=false`, SSL active, DB not publicly reachable, `storage:link` done.
