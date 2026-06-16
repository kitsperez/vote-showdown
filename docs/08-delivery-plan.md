# 08 - Delivery Plan (PM Layer)

> Strategic delivery layer for Vote Showdown. The tactical checklist lives in [`09-execution-checklist.md`](09-execution-checklist.md).

## Current Status

The project has moved beyond the original prototype migration plan. Laravel/Inertia scaffolding and the core production polling flow are implemented. Remaining work is now hardening, unresolved product decisions, live verification, and deployment readiness.

## Decision Log

| ID | Decision | Current status |
|---|---|---|
| D1 | Polls are scoped per creator; one active poll per creator | Implemented |
| D2 | Magic-link / one-tap invitee voting | Pending; reconcile with guest accounts first |
| D3 | Realtime via Reverb/Echo with tally + ticker + status events | Implemented; live/load verification pending |
| D4 | Production target is Forge/VPS | Pending deploy work |
| D5 | Inertia, not a separate REST API | Implemented |
| D6 | QR scan-to-vote | Implemented, but canonical QR target needs decision |
| D7 | Server-authoritative timer through `ends_at` | Implemented |
| D8 | Public sharing and guest voting | Implemented |
| D9 | Optional poll access password | Implemented |
| D10 | Option images/icons | Implemented in schema/service/types; browser verification pending |
| D11 | Edit/delete/close authority | Implemented: owner/admin edit/close/restart, admin delete/add-time |
| D12 | Guest page parity with authenticated poll view | Implemented |
| D13 | Any authenticated user can create polls | Implemented |
| D14 | Light-only brutalist theme polish | Implemented |
| D15 | Public poll URLs use a non-sequential `polls.uuid` route key; integer PK/FKs stay internal | Planned |
| D16 | Admin-only User Management (CRUD users + role assignment) under `role:admin` | Planned |
| D17 | Per-poll visitor access statistics (`poll_visits` table + `polls.visits_count`), backend/admin only | Planned |
| D18 | Admins may delete a specific voter's votes on a poll (with UI confirmation); tallies recompute and rebroadcast | Planned |
| D10a | Option image hardening: explicit MIME allowlist, larger size cap, surfaced per-option errors, `storage:link` verified | Implemented |
| D19 | Guest voters are no longer user accounts. Each vote carries a canonical `voter_key` (`user:{id}` / `email:{email}` / `token:{token}`); dedupe unique index moved onto it. Email-or-device-token fallback; existing `is_guest` accounts migrated onto votes then purged. **Supersedes D8's claimable-account model.** | Implemented |
| D20 | Role display labels are plain: Admin / Poll Creator / Voter (was "Showrunner" for admin) | Implemented |

## Remaining Epics

| Epic | Goal | Status |
|---|---|---|
| Realtime verification | Prove private/public channels, socket-id behavior, fallback, and load | Pending |
| Product decisions | Resolve magic-link model, QR target, signup role, engagement formula | Pending |
| Admin completion | Voter audit/log and product settings decision | Pending |
| Media verification | Confirm option image upload/render flow end to end | Pending |
| UUID poll URLs (D15) | Add `polls.uuid` route key, rebind routes/channels, update presenter/types/QR | Planned |
| User management (D16) | Admin-only user CRUD + role assignment, with last-admin/self safeguards | Planned |
| Visit statistics (D17) | `poll_visits` recording, dedupe, denormalized counter, admin stats surfacing | Planned |
| Vote moderation (D18) | Admin delete of a voter's votes with confirmation modal + tally rebroadcast | Planned |
| Image hardening (D10a) | MIME allowlist, size cap, surfaced errors, `storage:link` | Planned |
| Quality gates | Pest/build/lint/format/drift tests in CI | Pending |
| Accessibility | Keyboard, focus, labels, contrast, mobile checks | Pending |
| Deployment | Forge/VPS, Redis, Supervisor, Reverb, scheduler, TLS, smoke/rollback | Pending |

## Definition of Ready

A ticket may start only if:

- The relevant route/schema/component/service boundary is known.
- Any product decision it depends on is closed or explicitly scoped as a spike.
- Acceptance criteria are written in the module doc or checklist.
- Required local services are known, especially MySQL/Reverb/queue/scheduler for live features.

## Definition of Done

A ticket is done only if:

- Code and docs agree.
- Server-side validation/authorization are in place.
- Feature behavior is covered by focused Pest tests where practical.
- Frontend build/lint implications are handled.
- Realtime behavior is manually verified when the feature depends on Reverb.
- UX follows the frozen `src/` design reference unless the docs intentionally change the design.

## Risk Register

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Hot poll overwhelms broadcasts | High | Coalesce tallies, keep ticker cheap, load test |
| R2 | Single-choice double vote race | High | `Cache::lock` plus DB uniqueness |
| R3 | Acting voter sees duplicate updates | Medium | Verify socket-id/`toOthers()` behavior |
| R4 | Public endpoint abuse | Medium | Rate limits, logging, guest-account dedupe |
| R5 | Magic-link abuse | Medium | Signed temporary URLs, rate limits, expiry, email policy |
| R6 | Reverb unavailable | Medium | Writes tolerate broadcast failure, define degraded UX |
| R7 | Docs/code drift | High | Update docs in same change, use this checklist before coding |
| R8 | Expired polls remain active | Medium | `settleIfExpired` plus scheduler |
| R9 | Option media storage mismatch | Medium | Verify `storage:link`, public disk URLs, rendering |
| R10 | Auth role policy ambiguity | Medium | Close signup/elevation decision before role changes |
| R11 | UUID migration breaks existing links/FKs/channels | High | Add uuid as a separate route key (keep int PK/FKs), backfill rows, update channel/presenter/types together (D15) |
| R12 | Admin user management enables privilege escalation / lockout | High | `role:admin` gate + UserPolicy, validate role against enum, block self-demotion and last-admin removal (D16) |
| R13 | Visit recording inflates rows / leaks PII | Medium | Dedupe one-per-session-per-poll, hash IP, no raw PII stored (D17) |
| R14 | Vote deletion corrupts tallies or is misauthorized | Medium | Admin-only policy, derived tallies recompute, rebroadcast after delete (D18) |

## Release Gates

- [ ] `php artisan test` green and passing count recorded.
- [ ] `npm run build` green.
- [ ] Lint/format checks green.
- [ ] Enum/type drift check exists.
- [ ] Live Reverb smoke test passes for authenticated and public pages.
- [ ] Public guest voting and password-gated voting verified.
- [ ] Accessibility pass completed.
- [ ] Forge/VPS staging mirrors production topology.
- [ ] Rollback path verified.
