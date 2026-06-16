# Database Design
# Vote Showdown

> **Realigned to the source of truth.** Rewritten to match the actual MySQL 8 schema. The earlier
> version described a different model (`admins`, `room_code`/`voting_url`, fingerprint
> `voter_sessions`, `vote_options` pivot, `audit_logs`, denormalized vote counters) that does
> **not** match this app. Canonical schema: [`../03-database.md`](../03-database.md).

**Stack:** MySQL 8

---

## 1. Tables Overview

| Table | Purpose |
|---|---|
| users | All accounts (admins, creators, claimable guests) — one table, role on a column |
| polls | Poll definitions; public identity is a UUID |
| poll_options | Options/choices within a poll |
| votes | One row per voter per chosen option; deduped by `voter_key` |
| poll_visits *(planned, D17)* | Backend/admin visit statistics, salted IP hash only |

Plus Laravel standard tables: `password_reset_tokens`, `sessions`, `cache`, `jobs`/`job_batches`/`failed_jobs`.

> There is **no** separate `admins` table, **no** `room_code`/`voting_url` columns, **no**
> `voter_sessions`, **no** `vote_options` pivot, and **no** `audit_logs` table in the current build.
> (Audit logging is a *candidate* addition — see [`comparison.md`](comparison.md) — not a built table.)

---

## 2. Table Definitions

### 2.1 users

One table for every account. Roles live on a column (no roles table, no `admins` table).

| Column | Type | Notes |
|---|---|---|
| id | BIGINT UNSIGNED PK | Internal identity |
| name | VARCHAR | |
| email | VARCHAR UNIQUE | |
| email_verified_at | TIMESTAMP NULL | |
| password | VARCHAR | bcrypt/argon (Laravel hash) |
| role | ENUM('admin','creator') DEFAULT 'creator' | D19/D20 — no "invitee"/Voter role |
| avatar_text | VARCHAR(4) NULL | e.g. "JD" |
| avatar_bg_color | VARCHAR DEFAULT 'bg-[#9cf0ff]' | brutalist swatch |
| is_demo | BOOL DEFAULT 0, INDEX | seed/demo voters, purgeable (M1) |
| is_guest | BOOL DEFAULT 0, INDEX | claimable email-only guest account (D8) |
| remember_token | VARCHAR(100) NULL | |
| created_at / updated_at | TIMESTAMP | |

### 2.2 polls

| Column | Type | Notes |
|---|---|---|
| id | BIGINT UNSIGNED PK | Internal only — never exposed |
| uuid | UUID UNIQUE, INDEX | **Public route key** (D15); `getRouteKeyName() => 'uuid'` |
| creator_id | BIGINT UNSIGNED FK → users.id, cascade | Owner |
| title | VARCHAR | |
| description | TEXT NULL | |
| allow_multiple | BOOL DEFAULT 0 | single- vs multiple-choice |
| status | ENUM('draft','active','ended') DEFAULT 'draft', INDEX | no paused/archived |
| access_password | VARCHAR NULL | hashed; null = open poll (D9) |
| end_mode | ENUM('duration','deadline') DEFAULT 'duration' | how `ends_at` is resolved |
| duration_seconds | INT UNSIGNED NULL | used when end_mode = duration |
| deadline_at | TIMESTAMP NULL | used when end_mode = deadline |
| starts_at | TIMESTAMP NULL | set on launch |
| ends_at | TIMESTAMP NULL, INDEX | **server-authoritative end** |
| visits_count | INT UNSIGNED DEFAULT 0 | denormalized visit total (D17) |
| created_at / updated_at | TIMESTAMP | |

**End mode.** `duration` → `ends_at = starts_at + duration_seconds` (computed at launch);
`deadline` → `ends_at = deadline_at`. The rest of the app (`isActive`, `remainingSeconds`, the
scheduler sweep, broadcasts) reads only `ends_at`.

### 2.3 poll_options

| Column | Type | Notes |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| poll_id | BIGINT UNSIGNED FK → polls.id, cascade | |
| label | VARCHAR | option text |
| color_class | VARCHAR DEFAULT 'bg-[#00e3fd]' | bar color (brutalist) |
| badge_color_class | VARCHAR | badge color |
| image_path | VARCHAR NULL | uploaded image, public disk (D10) |
| icon | VARCHAR NULL | OR a named lucide icon (D10) |
| position | SMALLINT UNSIGNED DEFAULT 0 | display order |
| created_at / updated_at | TIMESTAMP | |
| INDEX | (poll_id, position) | |

App-level constraint: 2–10 options per poll. **No `vote_count` column** — counts are derived.

### 2.4 votes

One row per voter per chosen option. For single-choice that's one row per voter; for
multiple-choice, one row per selected option.

| Column | Type | Notes |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| poll_id | BIGINT UNSIGNED FK → polls.id, cascade | |
| poll_option_id | BIGINT UNSIGNED FK → poll_options.id, cascade | |
| user_id | BIGINT UNSIGNED FK → users.id, cascade, **nullable** | set only for authenticated voters |
| voter_key | string | canonical identity: `user:{id}` / `email:{email}` / `token:{token}` (D19) |
| voter_email / voter_name / voter_token | string NULL | guest identity stored on the vote |
| created_at / updated_at | TIMESTAMP | |
| UNIQUE | (poll_id, poll_option_id, voter_key) | hard dedupe |
| INDEX | (poll_id, poll_option_id) | fast tally |

> **Dedupe.** Multiple-choice is hard-guarded by the unique index. Single-choice (one vote per
> `(poll_id, voter_key)`) is additionally enforced by a per-`voter_key`-per-poll `Cache::lock` in
> `VoteService`, because a partial unique index isn't portable to MySQL. See [`../modules/voting.md`](../modules/voting.md).
>
> **No personal fingerprint store.** There is no `voter_sessions` table and no canvas/WebGL
> fingerprint. Guest dedupe is the email or a long-lived `voter_token` device cookie.

### 2.5 poll_visits *(planned — D17)*

Backend/admin visit statistics. One row per recorded access, deduped one-per-session-per-poll.

| Column | Type | Notes |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| poll_id | BIGINT UNSIGNED FK → polls.id, cascade | |
| user_id | BIGINT UNSIGNED FK → users.id, nullOnDelete, **nullable** | null for logged-out guests |
| ip_hash | VARCHAR(64) NULL | **salted hash only** — never raw IP (R13) |
| user_agent | VARCHAR NULL | |
| visited_at | TIMESTAMP, INDEX | |
| INDEX | (poll_id, visited_at) | |

`polls.visits_count` is the denormalized total for cheap reads; unique visitors and visit→vote
conversion are computed from the rows. No public visit UI.

---

## 3. Entity Relationship Summary

```
users
  └── polls            (creator_id; one creator → many polls)
        ├── poll_options (one poll → 2–10 options)
        ├── votes        (one poll → many votes; deduped by voter_key)
        └── poll_visits  (planned, D17; one poll → many visits)

votes.user_id → users  (nullable; set only for authenticated voters)
```

---

## 4. Design Notes

- **Tallies are derived (D3).** Option count = `COUNT(votes WHERE poll_option_id = ?)`, exposed via
  `withCount`. The `count` on an option prop is a read model, never writable. No `vote_count`/
  `total_votes` columns.
- **Voters are not accounts (D19).** Guest identity lives on the vote (`voter_email`, `voter_name`,
  `voter_token`), keyed by `voter_key`. `votes.user_id` is null for guests.
- **Server-authoritative timer.** `polls.ends_at` is the truth; the client only renders remaining seconds.
- **Roles on `users.role`** — three fixed concepts (Admin, Poll Creator, and guest voters who are
  not accounts), no dynamic permission tables.
- **Public identity is UUID (D15);** internal PK/FKs stay bigint for performance — sequential ids
  never leak into URLs/QRs/channels.
- **Cosmetic fields persisted** (`color_class`, `badge_color_class`, `avatar_text`, `avatar_bg_color`)
  so the brutalist look survives a round-trip; seeded from `src/data.ts`.

---

## 5. Scalability Considerations (without breaking D3)

- Tally reads lean on the `(poll_id, poll_option_id)` index. If a hot poll's COUNT path becomes the
  proven bottleneck under load testing, prefer **Redis-cached tallies / coalescing** before
  introducing a denormalized counter (which would conflict with D3). Decide with load-test evidence
  (see [`comparison.md`](comparison.md), open decision D-new-4).
- `votes` grows over time; archive old polls or partition by `poll_id` only if data volume warrants.
- Visit stats use the denormalized `polls.visits_count` plus deduped `poll_visits` rows to avoid
  expensive recounts.

---

## 6. Migrations

Order matters (FKs). One migration per table. `polls.uuid` (D15), `polls.visits_count` (D17), and
`poll_visits` (D17) ship as additive follow-on migrations (with a uuid backfill for existing rows),
not by rewriting the original `create_polls` migration. Exact `Schema::create` blocks live in
[`../03-database.md`](../03-database.md).

## 7. Seeders & Factories

- `UserSeeder` — a single Super Admin for fresh installs (dev/bootstrap only).
- `DefaultPollsSeeder` — ports the prototype polls + colors; seeded counts need real `votes` rows
  (tally is derived), so demo voters are tagged (`is_demo`) and purgeable; local/staging only.
- Factories: `UserFactory` (`->admin()/->creator()/->demo()`), `PollFactory` (`->active()/->ended()/->draft()`),
  `PollOptionFactory`, `VoteFactory`.
