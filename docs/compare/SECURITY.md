# Security Review
# Vote Showdown

> **Realigned to the source of truth.** Rewritten for the actual stack (Inertia session auth,
> `voter_key` dedupe, Reverb). The earlier version assumed Sanctum tokens, device-fingerprint
> voting, and a `voter_sessions` table — none of which exist here. Related: the
> `security-audit-agent` (`.claude/agents/`) audits code against this checklist.

---

## 1. Duplicate Vote Prevention

The core integrity concern. Defense is layered around the **canonical `voter_key`** (D19), not a
browser fingerprint.

**Layer 1 — Canonical voter identity (`voter_key`)**
- Every vote carries `user:{id}` (authenticated), `email:{email}` (guest by email), or
  `token:{token}` (guest by device cookie, the email fallback).
- Guests are not user accounts; their identity is stored on the vote row.

**Layer 2 — Database unique index**
- `UNIQUE(poll_id, poll_option_id, voter_key)` — the hard, non-bypassable guard. Concurrent
  duplicate submissions can't both persist.

**Layer 3 — Application lock for single-choice (R2)**
- Single-choice (one vote per `(poll_id, voter_key)`) is enforced by a per-`voter_key`-per-poll
  `Cache::lock` in `VoteService` (a partial unique index isn't portable to MySQL).

**Round reset.** A `restart` wipes votes and sets a new `starts_at`; the per-device `voted_poll_{uuid}`
cookie is keyed to the round so the same voter may vote again in the new round.

**Limitations.** A determined user with multiple emails/devices can still cast multiple votes; this
targets casual/accidental duplicates. High-stakes polls would need email verification or
private/invite-only polls (open decision).

---

## 2. Rate Limiting (as configured — tune under load, R4)

| Route | Limit |
|---|---|
| POST `/polls` (create) | `throttle:6,1` |
| POST `/p/{poll}/vote` (guest vote) | `throttle:20,1` |
| POST `/polls/{poll}/unlock` | `throttle:20,1` |
| GET `/polls/{poll}/join` (QR) | `throttle:30,1` |
| POST `/polls/{poll}/votes` (authed vote) | named `votes` limiter |
| Auth routes | starter-kit throttling |

Throttled responses return HTTP `429`. Finalize numbers with the `load-test-agent` evidence and
assert them in Pest.

---

## 3. CSRF Protection

- Web/session routes are CSRF-protected by Laravel by default; Inertia forwards the `XSRF-TOKEN`.
- Voting and controls are **web POSTs with session + CSRF**, not a token API — there is no Bearer
  flow to bypass. The narrow public guest endpoints are still CSRF-protected web routes.

---

## 4. XSS Prevention

**Server:** poll titles, descriptions, option labels, and guest names are stored as plain text and
passed as Inertia props.
**Client (React):** JSX escapes interpolated values by default; **never** use
`dangerouslySetInnerHTML` on user-generated content. Option `icon` is a named lucide icon (allowlist),
not raw HTML/SVG.
**CSP:** set a strict Content-Security-Policy at the web server; disallow inline scripts; allow only
known asset/WebSocket (Reverb) origins.

---

## 5. SQL Injection Prevention

- All queries use Eloquent / the query builder with parameter binding. No string-interpolated SQL.
- Route-model binding resolves polls by **UUID**, validated by Laravel before any query runs.
- Input is validated in FormRequests before controller/service logic.

---

## 6. Authorization

- Server-side only; UI visibility is convenience.
- `EnsureUserHasRole` (`role:admin`) gates admin routes (delete, add-time, User Management).
- `PollPolicy` decides create/view/update/launch/close/restart/delete and vote moderation.
- Owner-or-admin: edit/close/restart. Admin-only: delete, add-time, vote moderation (D18), user CRUD (D16).
- One active poll per creator on launch (D1).
- **User Management safeguards (D16):** validate `role` against the enum; block self-demotion,
  self-deletion, and removal of the last admin; set privilege fields only through the audited path.

---

## 7. Public / Guest & QR Abuse

- `/p/{poll}` (vote), `/r/{poll}` (results), `/polls/{poll}/join` (QR), and `/polls/{poll}/unlock`
  are intentionally public — verify each stays scoped to the bound poll and respects status.
- Votes are accepted only while `status = active` and before `ends_at`; ended/expired/draft polls reject.
- Password-gated polls (D9) reject votes until unlocked; wrong password is rejected at `unlock`.
- QR/share links encode only the **public UUID URL** — no secrets, no internal id.
- Rate limits (above) blunt enumeration/flooding; dedupe blunts ballot stuffing.

---

## 8. Real-time / Channel Security

- Private channel auth lives in `routes/channels.php`. In the current public-showdown model any
  authenticated user may listen to `poll.{uuid}`; public pages use the open public channel.
- If private/invite-only polls become a requirement, **channel authorization and public route
  access must be tightened together** (open decision).
- Broadcast payloads carry only presenter-shaped, non-sensitive fields (tally, ticker name/avatar,
  status). Persistence tolerates an unreachable broadcaster (R6).

---

## 9. Account Security

- Passwords hashed with Laravel's default (bcrypt/argon). Password reset via the starter kit.
- Auth routes rate-limited. New-signup default role is `creator` (elevation policy is an open decision).
- Admin accounts created via the audited User Management path (D16) or seeder, not ad-hoc role writes.

---

## 10. Data Privacy

- No browser fingerprint is stored. Guest identity on a vote is the email/name the guest supplied
  plus a random device `voter_token`.
- **Visit stats (D17) store only a salted IP hash**, never a raw IP (R13); backend/admin only, no public UI.
- `voted_poll_{uuid}` and `voter_token` cookies are convenience/dedupe signals; server-side checks
  remain authoritative.

---

## 11. Infrastructure

- HTTPS enforced (TLS); HTTP→HTTPS at the web server. MySQL not exposed publicly.
- `.env` out of version control; `APP_KEY`/`DB_*`/`MAIL_*`/Reverb secrets stored securely.
- `APP_DEBUG=false`, `APP_ENV=production`; generic 500s, details logged server-side only.
- Reverb WebSocket port firewalled to the app/web tier; Redis not publicly reachable.
