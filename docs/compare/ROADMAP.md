# Roadmap
# Vote Showdown

> **Realigned to the source of truth.** The original greenfield roadmap (build everything on
> Sanctum/Zustand/React Router with HTTP polling) no longer applies — the core app is **built**.
> This is now a *remaining-work* roadmap mapped to the canonical
> [`../09-execution-checklist.md`](../09-execution-checklist.md) and decision/risk logs in
> [`../08-delivery-plan.md`](../08-delivery-plan.md). Estimates are rough (S < 1d, M 1–3d, L 3–5d).

---

## Done (baseline)

Laravel 12 + Inertia v2 + React 19 scaffold; poll CRUD/edit/launch/close/restart; duration & deadline
end modes; optional password gate; option image/icon; authed + public guest voting with `voter_key`
dedupe and `Cache::lock`; QR/share + public results; Reverb tally/ticker/status events; scheduled
auto-end; role-aware dashboard. The frozen `src/` prototype is design reference only.

---

## Phase A — Realtime & Load Verification  *(highest priority; risks R1/R2/R3/R6)*
**Effort:** M–L · **Depends on:** local Reverb + scheduler running

- Two-browser live tests: authed and public guest/results channels.
- Verify socket-id / `toOthers()` so the acting voter sees no duplicate movement (R3).
- Kill-Reverb degraded-mode check: votes still persist; results page reload backstop works (R6).
- k6 load scenarios via the `load-test-agent`: `vote-storm`, `exactly-once-burst` (R2),
  `results-read-fanout` (D3 evidence), `reverb-subscribers` (R1). Tune the coalescing window.

## Phase B — Planned Feature Set  *(scoped in docs, not built)*
**Effort:** L overall · **Depends on:** Phase A not required, but share schema review

- **UUID exposure hardening (D15)** — confirm every route/channel/QR uses the UUID; Pest that the
  int id never leaks. *(Mostly built; verify + test.)*
- **Admin User Management (D16)** — `admin/users` resource, `UserPolicy`, last-admin/self-demotion
  safeguards. (M)
- **Poll Visit Statistics (D17)** — `poll_visits` + `visits_count`, salted IP hash, admin-only
  surfacing, conversion metric. (M)
- **Admin Vote Moderation (D18)** — delete a voter's votes by `voter_key`, recompute + rebroadcast,
  confirmation modal. (S–M)
- **Option image hardening (D10a)** — MIME allowlist, larger cap, surfaced per-option errors,
  `storage:link` verified. (S)

## Phase C — Product Decisions  *(close before dependent work)*
**Effort:** S (decisions) — see open decisions in the checklist & [`comparison.md`](comparison.md)

- Magic-link voting model vs. current guest model (D2).
- Canonical QR target: `/p/{uuid}` vs. `/polls/{uuid}/join`.
- New-signup default role / elevation policy.
- Dashboard engagement-rate formula.
- D-new-* from the comparison review (multiple-choice already supported; room code; pause/archive;
  denormalized counters only if load proves it; audit logging scope).

## Phase D — Quality Gates & Accessibility  *(risks R7)*
**Effort:** M · **Depends on:** Phase A for the realtime/load gates

- Re-run and record `php artisan test`; `npm run build`; lint/format.
- Enum/type drift check (PHP enums ↔ `types/models.ts`) as a CI gate.
- Wire CI: PHP tests, frontend build, TypeScript, lint/format, drift.
- Accessibility pass: keyboard nav, focus, labels, contrast (brutalist UI).
- Confirm rate limits on vote/public-vote/unlock/QR/control routes (R4).

## Phase E — Deployment Hardening  *(risks R4/R6/R8)*
**Effort:** M–L · **Depends on:** Phases A & D

- Forge/VPS: web + TLS, MySQL 8, Redis (cache/queue/locks/coalescing).
- Supervisor for queue worker, Reverb, and `schedule:run`.
- Staging smoke test: auth, public + password-gated voting, QR, live Reverb, scheduled expiry.
- Verify rollback path.

---

## Risks (carried from the delivery plan)

R1 broadcast storm · R2 single-choice race · R3 duplicate acting-user updates · R4 public abuse ·
R6 Reverb unavailable · R7 docs/code drift · R8 expired polls · R11 UUID migration ·
R12 user-management privilege escalation · R13 visit-stat PII · R14 vote-deletion tally corruption.
Mitigations are in [`../08-delivery-plan.md`](../08-delivery-plan.md).

## Release Gates

Mirrors [`QA_TEST_PLAN.md`](QA_TEST_PLAN.md) §12 and the delivery plan's gates: tests/build/lint/drift
green, two-browser Reverb verified, guest + password voting verified, load thresholds met, a11y pass,
production `APP_DEBUG=false` + TLS + `storage:link`, rollback verified.

---

> **Stack is fixed.** No phase introduces REST/Sanctum, Zustand, React Router, shadcn, Recharts, or
> HTTP-polling-as-strategy. New packages are proposed only when a feature genuinely needs one and the
> source-of-truth docs are updated in the same change.
