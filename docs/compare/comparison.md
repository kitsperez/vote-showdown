# Comparison Review — `docs/compare/` vs. Current Vote Showdown Build

> **Author role:** Senior Web Architect + Senior Project Manager review.
> **Date:** 2026-06-16
> **Purpose:** Compare the uploaded `docs/compare/` document set against the current source-of-truth docs (`docs/README.md`, `docs/08-delivery-plan.md`, `docs/09-execution-checklist.md`) and identify which **modules, plans, and automation/agents** are worth adopting into the current build — and which to explicitly reject.
> **Status:** Review only. No code or doc-of-record changes made.
>
> **Update (2026-06-16):** Following this review, the decision was made to keep the source-of-truth
> stack unchanged. The other files in this folder have since been **rewritten in place to match our
> actual stack** (Inertia/Reverb/`voter_key`/UUID/roles) — so they now read as adapted secondary
> references, not the original "QR Voting Application" spec. This document's "compare set" descriptions
> below reflect the **original** uploaded versions and are kept as the record of what was adopted vs.
> rejected and why. The numbered docs in [`../`](../) remain canonical.

---

## 1. Executive Summary

The `docs/compare/` folder is a **self-consistent, well-written spec for a *different* application** — a "QR Voting Application" designed as:

- **Laravel 12 + REST API (`/api/v1`) + Sanctum Bearer tokens**
- **Standalone React SPA**: React Router v6, Zustand, shadcn/ui, Recharts, Axios
- **Anonymous device-fingerprint voting** (3-layer dedupe: DB unique index + hashed fingerprint + `voter_sessions`)
- **HTTP polling** for live results (with a documented SSE → Reverb upgrade path)
- Separate `admins` table, `room_code` access, richer poll lifecycle, `audit_logs`, projector mode

Our live build (**Vote Showdown**) is architecturally different and more advanced in several dimensions:

- **Inertia v2 (server-driven React)** — *not* a REST API + SPA (locked decision **D5**)
- **Laravel Reverb + Echo** real-time already implemented (the compare set lists this as a *future* scale tier)
- **Unified `users` table + roles** (Admin / Poll Creator), not a separate `admins` table
- **`voter_key` dedupe model** (`user:` / `email:` / `token:`) with email guest voting (**D19**), not anonymous fingerprinting
- **Brutalist design system** ported from `src/` (locked) — *not* shadcn/ui

**Verdict:** Do **not** treat the compare set as a migration target. Most of its *architecture* conflicts with our locked decisions and would be a regression. However, it contains **~8 genuinely additive product modules and ~4 process/quality assets** that are architecture-agnostic and would strengthen our build. The highest-value adds are **audit logging**, a **structured QA + load-test catalog**, **poll duplicate/reset/pause/archive lifecycle**, **projector mode**, and a **consolidated security doc**.

---

## 2. Architecture Reconciliation

How each major architectural choice in the compare set maps to ours. Legend: ✅ Adopt · 🔁 Adapt · ⛔ Reject (conflicts with a locked decision).

| Topic | `docs/compare/` says | Current build | Verdict | Rationale |
|---|---|---|---|---|
| API style | REST `/api/v1` + Sanctum tokens | Inertia responses (D5) | ⛔ Reject | D5 is locked. Inertia removes the need for a token API surface. |
| Frontend shell | SPA: React Router v6, Zustand, Axios | Inertia pages + Ziggy, server props | ⛔ Reject | Inertia owns routing & data; Zustand/Router would duplicate it. |
| UI kit | shadcn/ui + Tailwind 3 | Brutalist tokens from `src/`, Tailwind v4 | ⛔ Reject | Design comes from `src/` (locked). |
| Charts | Recharts | Custom brutalist bars | 🔁 Adapt | Keep custom look; Recharts optional only if a complex chart appears. |
| Realtime | HTTP polling (MVP) → SSE → Reverb | Reverb/Echo already live | 🔁 Adapt | We are already at their "final" tier. **But** adopt polling as the documented **degraded fallback** for risk **R6** (Reverb down). |
| Vote dedupe | Device fingerprint + `voter_sessions` + DB unique | `voter_key` + unique index + `Cache::lock` (D19) | 🔁 Adapt | D19 supersedes anonymous model. **Optionally** layer a hashed device token as an *extra* signal for token-based guests. |
| Auth model | Separate `admins` table, no self-registration | Unified `users` + roles, registration open (D13) | ⛔ Reject | Unified model is more capable; keep it. |
| Vote counts | Denormalized `total_votes`/`vote_count` counters | Tallies derived from `votes` (D3 locked) | 🔁 Adapt | Keep D3 for correctness. Document denormalized counters as a **scale-tier option** only if load tests prove COUNT() is the bottleneck. |
| Poll identity | `room_code` (typeable) + `voting_url` | UUID route key planned (D15) | 🔁 Adopt-alongside | A short typeable **room code** can coexist with the UUID URL — different jobs (manual entry vs. share link). See §3. |

---

## 3. Modules We Could Add

Each row is a candidate vertical slice. **Effort** is rough (S < 1d, M 1–3d, L 3–5d). **Decision** flags whether a product call is needed first.

| # | Module | What it adds | Status in our build | Value | Effort | Depends on / Decision |
|---|---|---|---|---|---|---|
| A | **Audit logging** | Polymorphic `audit_logs` (actor, action, old/new values, IP/UA) recording every poll & admin action | ❌ Absent | **High** — accountability, debugging, pairs with D16/D18 | M | Architecture-agnostic. Recommend an `AuditLogService::log()` written from Services only. |
| B | **Poll duplicate** | Clone a poll's title/options (not votes) into a new draft | ❌ Absent | **High** — top reusability UX win | S | None. |
| C | **Reset results** | Delete all votes for a poll + rebroadcast empty tally | Partial (restart exists) | Medium | S–M | Confirm semantics vs. our existing `restart`. Likely already covered — verify. |
| D | **Pause state** | `paused` status: stop new votes without closing | ❌ (we have active/closed/restart) | Medium | M | Product decision: does pause add value over close+restart? |
| E | **Archive state** | Hide finished polls from main list, keep accessible | ❌ Absent | Medium — list hygiene at scale | S | Product decision on list filters. |
| F | **Projector / fullscreen results mode** | Large-display, minimal-UI live results for live events | ❌ Absent | **High** — strong event/demo feature, pairs with public results page | M | None (reuses existing tally + Reverb). |
| G | **Room code (manual entry)** | Short human-typeable code as alt to QR/URL | ❌ (QR + URL only) | Medium–High — accessibility, no-camera path | M | Coexists with D15 UUID. Decision: keyspace, collision retry, case-insensitive. |
| H | **Multiple-choice polls** | `single` vs `multiple` poll type via a vote→option pivot | ❌ (single-choice model) | Medium — broadens use cases | L | **Product decision.** Touches schema, `VoteService`, dedupe, tally, UI. Largest item. |

**Recommended adopt now:** A, B, F (high value, low/medium effort, no conflicts).
**Adopt with a quick product call:** D, E, G.
**Defer / scope as its own epic:** C (verify first), H (largest, schema-touching).

---

## 4. Plans & Process We Could Add

The compare set's *process* docs are stronger than ours in places and are largely architecture-agnostic.

| # | Asset | What it gives us | Our current state | Verdict |
|---|---|---|---|---|
| P1 | **Structured QA test catalog** (`QA_TEST_PLAN.md`) | Numbered, traceable test cases (TC-AUTH-*, TC-VOTE-*, TC-SEC-*) grouped by module, with explicit edge/negative cases | We have Pest broadly + checklist items, no test-case catalog | ✅ **Adopt** — adapt IDs to our routes (Inertia, public `/p/`, `/r/`, voter_key, password gate). Directly serves our Release Gates. |
| P2 | **Load-test scenarios (k6)** | Concrete scenarios: 500 concurrent voters (p95 < 500ms), 100-vote burst (exactly-once), results under load | Pending verification (R1, R3, "burst/load test" checklist item) | ✅ **Adopt** — these are the missing acceptance criteria for our Reverb load verification epic. |
| P3 | **Consolidated SECURITY.md** | Single rate-limit table, CSP, XSS/SQLi/CSRF checklist, data-privacy section, password policy | Security concerns scattered across risk register + checklist | ✅ **Adopt (adapted)** — drop fingerprint/Sanctum specifics; keep rate-limit table, CSP, privacy, IP-hashing (aligns with D17 salted IP hash). |
| P4 | **Explicit rate-limit matrix** | Per-route limits (login, vote, results, validate) with 429 + Retry-After | We have rate limiting but no consolidated table | ✅ **Adopt** — fills the open "verify rate limits" checklist item with concrete numbers to assert in tests. |
| P5 | **Effort/risk-estimated roadmap** (`ROADMAP.md`) | Hour-estimated phases with risks + dependencies | Our plan is phase/decision-based, no estimates | 🔁 Optional — our delivery plan is more current; cherry-pick the *risk + dependency* discipline, ignore the hour estimates (they assume greenfield). |
| P6 | **User-story format** (`USER_STORIES.md`) | "As a [role], I want… so that…" with MoSCoW priority | We track features in modules/checklist | 🔁 Optional — useful for stakeholder communication; our acceptance criteria already cover the substance. |

---

## 5. Conflicts — Explicitly Reject (with reasons)

To prevent accidental scope creep, these compare-set elements should **not** be pulled in:

1. **REST API + Sanctum tokens** — violates D5 (Inertia). Would create a parallel, unmaintained API surface.
2. **Zustand + React Router + Axios** — Inertia already provides routing, server state, and page props. Adding these duplicates responsibility and invites drift.
3. **shadcn/ui component library** — design is locked to the brutalist `src/` system. shadcn's defaults fight that aesthetic.
4. **Separate `admins` table / no self-registration** — we use a unified `users` table with roles (D13/D16/D20). The split-table model is a regression.
5. **Device-fingerprint anonymous voting as the primary dedupe** — superseded by `voter_key` (D19). *Exception:* a hashed device token may be layered as one **extra** signal for `token:`-based guests (see §3 / §2).
6. **Denormalized vote counters as the default** — conflicts with D3 (tallies derived). Keep as a documented scale option only, gated on load-test evidence.
7. **HTTP polling as the realtime strategy** — we already run Reverb. Keep polling **only** as the documented degraded fallback (R6).

---

## 6. Agents & Automation Opportunities

The prompt asked about "agents." Mapping the compare set's quality/process emphasis onto our existing custom agents and CI:

| Opportunity | Mechanism | Notes |
|---|---|---|
| **Security review before merge** | `security-audit-agent` (already defined) | Compare set's `SECURITY.md` becomes the agent's checklist baseline — run it on any PR touching `app/Http/`, `routes/`, FormRequests, channels (matches the agent's stated trigger). |
| **Docs/code drift enforcement** | `plan-sync` agent (already defined) | If we adopt modules A/B/F etc., run `plan-sync` so `docs/`, decision log, checklist, `CLAUDE.md`, and README stay reconciled (mitigates R7). |
| **CI quality gates** | GitHub Actions (planned, Phase 6) | Wire P1 (Pest catalog), `npm run build`, lint/format, enum-drift, and a k6 (P2) smoke job. The compare set's `QA_TEST_PLAN.md` §12 is a ready-made pre-launch checklist. |
| **Load-test automation** | k6 scripted from P2 scenarios | Serves the pending Reverb load-verification epic; no agent needed, but results feed the R1 coalescing-window decision. |

> Note: nothing in `docs/compare/` defines custom *sub-agents* — the "agents" worth adding are CI gates plus better use of the two agents we already have.

---

## 7. Recommended Prioritized Backlog (PM View)

Sequenced to maximize value while respecting current in-flight work (D15–D18, D10a are already scoped/planned).

**Wave 1 — Low-risk, high-value, no decisions needed (do alongside current planned work):**
1. **Module A — Audit logging** (pairs naturally with D16 user management + D18 vote moderation already in flight).
2. **Module B — Poll duplicate.**
3. **Module F — Projector/fullscreen results mode.**
4. **P1 — Stand up the QA test-case catalog** (adapt IDs to Inertia/voter_key/password routes).
5. **P4 — Document the rate-limit matrix** and assert it in tests (closes an open checklist item).

**Wave 2 — Quick product decision, then build:**
6. **Module G — Room code manual entry** (decide: coexist with UUID, keyspace, case handling).
7. **Module D/E — Pause + Archive states** (decide: do they earn their complexity over close/restart + list filters?).
8. **P3 — Consolidated, adapted SECURITY.md.**
9. **P2 — k6 load scenarios** wired into the Reverb load-verification epic.

**Wave 3 — Larger / decision-heavy:**
10. **Module H — Multiple-choice polls** (own epic: schema + service + dedupe + tally + UI). Biggest item; only if product wants it.
11. **Module C — Reset results** — first **verify** whether existing `restart` already satisfies this; adopt only the gap.

---

## 8. Open Product Decisions This Review Raises

These need an owner decision before the related module starts (Definition of Ready):

- **D-new-1:** Do we want **multiple-choice** polls? (Gates Module H — large.)
- **D-new-2:** Add a **typeable room code** alongside UUID URLs (D15)? If yes: keyspace, ambiguous-char exclusion, collision-retry, case-insensitive lookup.
- **D-new-3:** Add **pause** and/or **archive** statuses, or keep the lean active/closed/restart lifecycle?
- **D-new-4:** Adopt **denormalized vote counters** at scale, or hold D3 (derived tallies) and rely on indexing/read-replica instead? (Decide only after P2 load tests.)
- **D-new-5:** Layer a **hashed device token** as an extra dedupe signal for anonymous/token guests, or keep `voter_key` alone?
- **D-new-6:** Scope of **audit logging** — admin actions only, or also voter-facing events?

---

## 9. One-Paragraph Recommendation

Keep the current Inertia + Reverb + `voter_key` architecture exactly as-is; the compare set's architecture is a step backward for us and should not be migrated to. Mine it instead: adopt **audit logging, poll duplicate, projector mode, the structured QA/load-test catalog, and a consolidated security/rate-limit doc** in the near term (Wave 1), all of which are additive and conflict-free. Hold the larger or opinionated items (**multiple-choice, room codes, pause/archive, denormalized counters**) behind explicit product decisions. This captures roughly 80% of the compare set's real value at low risk while protecting every locked decision (D3, D5, D13, D19, D20).
