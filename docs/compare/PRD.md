# Product Requirements Document (PRD)
# Vote Showdown

> **Realigned to the source of truth.** Product scope kept, but auth model, roles, stack, and
> real-time approach were rewritten to match the actual build (unified `users` + roles, guest
> voting by email/`voter_key`, Inertia + Reverb). The earlier draft assumed a separate `admins`
> table, anonymous device-fingerprint voting, and Sanctum — none of which apply. Canonical product
> framing: [`../01-overview.md`](../01-overview.md).

**Status:** Living document (the app is built; this captures intent + scope).

---

## 1. Overview

### 1.1 Purpose
A cartoony Neo-Brutalist real-time voting app. Authenticated creators build and run polls; anyone
can vote — logged in, or as a public guest by email/device — and watch results update live.

### 1.2 Goals
- Let creators build and run polls quickly, with a live, hype presentation.
- Let voters participate with low friction (public guest voting, no account required to vote).
- Prevent duplicate votes without forcing voter accounts (canonical `voter_key`).
- Show live results in real time over WebSockets.

### 1.3 Non-Goals (current)
- Multi-tenant/team org accounts or billing.
- Strong voter identity verification (casual dedupe only).
- Third-party export integrations.
- Native mobile apps.
- A separate REST API / SPA (the app is Inertia by decision D5).

---

## 2. Users & Roles

| Role | Account | Capability |
|---|---|---|
| **Admin** | yes | Oversee any poll; delete; add time; moderate votes; manage users |
| **Poll Creator** (`creator`) | yes | Create/edit/launch/close/restart their own polls |
| **Voter** | **not an account** | Vote (authed, or guest by email/device); view results |

Guest voters are not user accounts (D19); their identity rides on the vote via `voter_key`. A claimable
`is_guest` user row exists only as a legacy convenience path. Role labels are plain: Admin / Poll
Creator (D20).

---

## 3. Scope (built)

| Feature | State |
|---|---|
| Auth (login/register/reset/verify/settings) | Built (starter kit, session-based) |
| Create poll (single / multiple choice, 2–10 options) | Built |
| Poll lifecycle: draft → active → ended; restart | Built |
| End modes: countdown (duration) or deadline → `ends_at` | Built |
| Optional access password (D9) | Built |
| Option image upload / lucide icon (D10/D10a) | Built |
| Authenticated voting + dedupe (`voter_key`, `Cache::lock`) | Built |
| Public guest voting by email (`/p/{uuid}`) | Built |
| QR / share links + public results page (`/r/{uuid}`) | Built |
| Live tally / ticker / status over Reverb/Echo | Built |
| Role-aware dashboard + metrics | Built (engagement formula open) |
| Scheduled auto-end of expired polls | Built |
| Admin vote moderation (D18) | Planned |
| Admin user management (D16) | Planned |
| Per-poll visit statistics (D17) | Planned |

---

## 4. Functional Requirements

### Authentication
- FR-01 Users log in with email + password (session guard).
- FR-02 Password reset via email.
- FR-03 New signups default to `creator` (elevation policy is an open decision).
- FR-04 Admin-only areas are gated by `role:admin` + policy.

### Poll Creation & Management
- FR-05 A poll has a title, optional description, type (single/multiple), and 2–10 options.
- FR-06 Each poll gets a public **UUID** used in all URLs/QRs/channels (D15).
- FR-07 Launch resolves `ends_at` from duration or deadline; one active poll per creator (D1).
- FR-08 Owner/admin may edit, close, restart; admin may delete and add time.
- FR-09 Optional access password gates voting until unlocked (D9).
- FR-10 Options may carry an uploaded image or a named icon.

### Voting
- FR-11 Voters reach a poll by authed page, public link, or QR.
- FR-12 Votes are accepted only while `active` and before `ends_at`.
- FR-13 One vote per `voter_key` (single-choice), enforced by lock + unique index.
- FR-14 Guests vote by email or device token; identity stored on the vote, not as an account.
- FR-15 Voter sees confirmation/voted state after voting.

### Results & Real-time
- FR-16 Tallies are derived from `votes` (never client-sent) and shown with counts + percentages.
- FR-17 Results update live via Reverb (`.vote.cast`, `.voter.ticked`, `.poll.status`).
- FR-18 A public results/projection page shows the live tally and recent voters.
- FR-19 Persistence succeeds even if broadcasting fails (degraded mode, R6).

---

## 5. Non-Functional Requirements

- NFR-01 Handle a busy poll (target ~500 concurrent voters) without 5xx; validate via load testing (R1).
- NFR-02 Vote POST p95 < 500 ms; results read p95 < 300 ms under target load.
- NFR-03 Voting works on modern mobile browsers; QR scannable at print size.
- NFR-04 Exactly-once vote integrity under burst (R2).
- NFR-05 Deployable on Forge/VPS with Redis, Supervisor (queue/Reverb/scheduler), TLS, MySQL 8.
- NFR-06 Passwords hashed with the Laravel default; `APP_DEBUG=false` in production.

---

## 6. Future Enhancements (post-current)

- Magic-link / one-tap invitee voting (D2), reconciled with the guest model.
- Admin user management (D16), visit statistics (D17), vote moderation (D18).
- Audit logging, poll duplicate, projector mode, room-code manual entry — see [`comparison.md`](comparison.md).
- CSV/PDF export, scheduled open time, per-poll branding, private/invite-only polls (open decision).
