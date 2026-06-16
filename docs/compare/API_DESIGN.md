# Route & Contract Reference
# Vote Showdown

> **Realigned to the source of truth.** This app is **Inertia, not a REST API** (decision D5).
> There is no `/api/v1`, no Sanctum Bearer tokens, and no JSON envelopes. The earlier
> "API Design" doc described an architecture we are **not** adopting. This file now documents the
> actual routes from `routes/web.php` and the contract they carry. Canonical: [`../04-backend.md`](../04-backend.md).

**Transport:** Inertia (server-rendered React props over the web/session guard).
**Auth:** Laravel session web guard. **Format:** Inertia page responses + redirects with flash;
a few narrow operational endpoints return redirects/JSON-ish payloads (votes, controls, unlock,
public guest vote, broadcast auth).

---

## Legend

| Symbol | Meaning |
|---|---|
| 🔒 | Requires authentication (`auth`, `verified`) |
| 🛡️ | Additionally `role:admin` |
| 🌐 | Public — no login required |
| 📄 | Returns an Inertia page (`Inertia::render`) |
| ↩️ | Returns a redirect + flash (operational mutation) |

---

## 1. Authentication (starter kit)

Login, registration, password reset, email verification, profile, and password settings are the
Laravel Inertia starter routes in `routes/auth.php` and `routes/settings.php`. Session-based; **no
token issuance**. Registration default role is `creator` (open decision: signup/elevation policy).

---

## 2. Public / Guest (no login)

### GET `/p/{poll}` 🌐 📄 — `public-poll.show`
Public guest voting page for a poll (route-bound by **UUID**). Props: presented `poll`, recent
`voters`, and `hasVoted` (from the `voted_poll_{uuid}` round cookie).

### POST `/p/{poll}/vote` 🌐 ↩️ — `public-poll.vote` · `throttle:20,1`
Cast a guest vote. Body: `poll_option_id`, optional `email`, optional `name`. Server derives the
`voter_key` (`email:{email}` or `token:{token}` device cookie), enforces active-poll + password
gate + dedupe, then `VoteService::cast`. Returns back with success/error flash; sets
`voter_token` and `voted_poll_{uuid}` cookies.

### GET `/r/{poll}` 🌐 📄 — `public-poll.results`
Read-only spectator/projection page (UUID-bound). Props: presented `poll`, recent `voters`. Live
via the public `poll.{uuid}` channel; falls back to a light reload poll if Reverb is unreachable.

### GET `/polls/{poll}/join` 🌐 ↩️/📄 — `polls.join` · `throttle:30,1`
QR scan-to-vote entry. (Open decision D-open: redirect to `/p/{poll}` vs. an auth-intended join.)

### POST `/polls/{poll}/unlock` 🌐 ↩️ — `polls.unlock` · `throttle:20,1`
Submit the access password for a gated poll (D9). Works for guests and authed users. Returns back
with success/error flash; unlock state is tracked server-side.

---

## 3. Authenticated App (Inertia pages)

All under `auth` + `verified`.

| Method / URI | Name | Kind | Notes |
|---|---|---|---|
| GET `/dashboard` 🔒 | `dashboard` | 📄 | Role-aware: active poll, recent polls, metrics |
| GET `/polls` 🔒 | `polls.index` | 📄 | Poll list |
| GET `/polls/create` 🔒 | `polls.create` | 📄 | Create form (creators/admins via policy) |
| POST `/polls` 🔒 | `polls.store` | ↩️ | `throttle:6,1`; `StorePollRequest`; `PollService::create` |
| GET `/polls/{poll}` 🔒 | `polls.show` | 📄 | Show/results/voting/control surface (UUID-bound) |
| GET `/polls/{poll}/edit` 🔒 | `polls.edit` | 📄 | Owning creator or admin |
| PUT/PATCH `/polls/{poll}` 🔒 | `polls.update` | ↩️ | `UpdatePollRequest`; owner/admin |
| DELETE `/polls/{poll}` 🛡️ | `polls.destroy` | ↩️ | Admin only |

### Voting & moderation
| Method / URI | Name | Kind | Notes |
|---|---|---|---|
| POST `/polls/{poll}/votes` 🔒 | `polls.votes.store` | ↩️ | `throttle:votes` named limiter; authed vote |
| DELETE `/polls/{poll}/voter-votes` 🛡️ | `polls.voter-votes.destroy` | ↩️ | D18; `voter_key` in body; recompute + rebroadcast |

### Run-time controls
| Method / URI | Name | Kind | Notes |
|---|---|---|---|
| POST `/polls/{poll}/control/close` 🔒 | `polls.control.close` | ↩️ | Owning creator OR admin (not behind role:admin) |
| POST `/polls/{poll}/control/restart` 🔒 | `polls.control.restart` | ↩️ | Owning creator OR admin; clears votes |
| POST `/polls/{poll}/control/add-time` 🛡️ | `polls.control.add-time` | ↩️ | Admin only; body `seconds` |

### Admin User Management (D16)
| Method / URI | Name | Notes |
|---|---|---|
| `admin/users` resource (no `show`) 🛡️ | `admin.users.*` | index/create/store/edit/update/destroy under `role:admin` |

---

## 4. Broadcast Channels (`routes/channels.php`)

| Channel | Auth |
|---|---|
| `App.Models.User.{id}` | self only |
| `poll.{poll}` (private) | any authenticated user (public-showdown model) |
| `poll.{uuid}` (public) | open, for guest/results pages |

Events on these channels: `.vote.cast` (tally), `.voter.ticked` (ticker), `.poll.status`
(status/endsAt). See [`../07-realtime.md`](../07-realtime.md).

---

## 5. Contract Notes

- **No REST/JSON envelope.** Reads return Inertia pages with **camelCase props** shaped by
  `PollPresenter`/`VoterPresenter`. Mutations return **redirect + flash**; the React side reads
  `flash` from shared Inertia props (toast), never `alert()`.
- **Validation errors** surface as Inertia `errors` bag (e.g. `errors['options.0.image']`), not a
  custom JSON error body.
- **Identity is the UUID** in every URL, QR/share link, and channel name (D15). The integer id is
  never present in props or URLs.
- **Tallies are server-derived** and arrive via props or the `.vote.cast` broadcast — clients never
  send counts (D3).

---

## 6. Rate Limits (as configured)

| Route | Limit |
|---|---|
| POST `/polls` (create) | `throttle:6,1` |
| POST `/p/{poll}/vote` (guest vote) | `throttle:20,1` |
| POST `/polls/{poll}/unlock` | `throttle:20,1` |
| GET `/polls/{poll}/join` (QR) | `throttle:30,1` |
| POST `/polls/{poll}/votes` (authed vote) | named `votes` limiter |

Tune these under load testing (R4); see [`SECURITY.md`](SECURITY.md) and [`QA_TEST_PLAN.md`](QA_TEST_PLAN.md).
