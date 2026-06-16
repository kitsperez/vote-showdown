# Database Design
# QR Voting Application

**Stack:** MySQL 8  
**Version:** 1.0

---

## 1. Tables Overview

| Table | Purpose |
|---|---|
| admins | Admin user accounts |
| polls | Poll definitions |
| poll_options | Options/choices within a poll |
| votes | Individual vote records |
| voter_sessions | Tracks devices that have voted |
| audit_logs | Records all admin actions |

---

## 2. Table Definitions

---

### 2.1 admins

Stores admin user accounts. No voter accounts exist.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| name | VARCHAR(100) | NOT NULL | |
| email | VARCHAR(150) | NOT NULL, UNIQUE | |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed |
| remember_token | VARCHAR(100) | NULLABLE | Laravel standard |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `email`

---

### 2.2 polls

Stores all poll definitions created by admins.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| admin_id | BIGINT UNSIGNED | NOT NULL, FK → admins.id | Owner |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | NULLABLE | |
| instructions | TEXT | NULLABLE | |
| type | ENUM('single', 'multiple') | NOT NULL, DEFAULT 'single' | |
| status | ENUM('draft','active','paused','closed','archived') | NOT NULL, DEFAULT 'draft' | |
| room_code | VARCHAR(10) | NOT NULL, UNIQUE | Auto-generated, uppercase alphanumeric |
| voting_url | VARCHAR(255) | NOT NULL, UNIQUE | Slug-based URL |
| qr_code_path | VARCHAR(255) | NULLABLE | File path to stored QR image |
| total_votes | INT UNSIGNED | NOT NULL, DEFAULT 0 | Denormalized counter |
| opened_at | TIMESTAMP | NULLABLE | When poll was last opened |
| closed_at | TIMESTAMP | NULLABLE | When poll was last closed |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `room_code`
- UNIQUE INDEX: `voting_url`
- INDEX: `admin_id`
- INDEX: `status`

**Relationships:**
- Belongs to `admins` via `admin_id`
- Has many `poll_options`
- Has many `votes`
- Has many `voter_sessions`

---

### 2.3 poll_options

Stores individual choices for each poll.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| poll_id | BIGINT UNSIGNED | NOT NULL, FK → polls.id | Cascade delete |
| label | VARCHAR(255) | NOT NULL | The text of the option |
| vote_count | INT UNSIGNED | NOT NULL, DEFAULT 0 | Denormalized for fast reads |
| display_order | TINYINT UNSIGNED | NOT NULL, DEFAULT 0 | Sort order in UI |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `poll_id`
- COMPOSITE INDEX: `(poll_id, display_order)`

**Relationships:**
- Belongs to `polls` via `poll_id`
- Referenced by `votes` (many-to-many via vote_option pivot)

**Constraints:**
- Application-level: minimum 2 options, maximum 10 options per poll

---

### 2.4 votes

Stores one record per voter per poll. For multiple-choice polls, selected options are stored in `vote_options`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| poll_id | BIGINT UNSIGNED | NOT NULL, FK → polls.id | |
| voter_token | VARCHAR(64) | NOT NULL | Hashed device fingerprint token |
| ip_address | VARCHAR(45) | NULLABLE | IPv4 or IPv6 |
| user_agent | TEXT | NULLABLE | Browser info |
| created_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `poll_id`
- UNIQUE COMPOSITE INDEX: `(poll_id, voter_token)` — prevents duplicate votes
- INDEX: `ip_address`

**Relationships:**
- Belongs to `polls`
- Has many `vote_options` (pivot)

**Note:** No personal voter identity is stored. `voter_token` is a hashed composite of device signals.

---

### 2.5 vote_options

Pivot table linking votes to selected poll options. Supports both single and multiple-choice polls.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| vote_id | BIGINT UNSIGNED | NOT NULL, FK → votes.id | Cascade delete |
| poll_option_id | BIGINT UNSIGNED | NOT NULL, FK → poll_options.id | |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `vote_id`
- INDEX: `poll_option_id`
- UNIQUE COMPOSITE INDEX: `(vote_id, poll_option_id)`

---

### 2.6 voter_sessions

Tracks which devices have voted per poll. Used as a secondary duplicate-vote guard alongside the `votes.voter_token` unique index.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| poll_id | BIGINT UNSIGNED | NOT NULL, FK → polls.id | |
| session_token | VARCHAR(64) | NOT NULL | Hashed session identifier |
| fingerprint_hash | VARCHAR(64) | NULLABLE | Browser fingerprint hash |
| has_voted | TINYINT(1) | NOT NULL, DEFAULT 0 | |
| voted_at | TIMESTAMP | NULLABLE | |
| expires_at | TIMESTAMP | NULLABLE | TTL for cleanup |
| created_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE COMPOSITE INDEX: `(poll_id, session_token)`
- INDEX: `expires_at` — for cleanup jobs

---

### 2.7 audit_logs

Records all significant admin actions for accountability and debugging.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| admin_id | BIGINT UNSIGNED | NULLABLE, FK → admins.id | Null if system action |
| action | VARCHAR(100) | NOT NULL | e.g., `poll.created`, `poll.closed` |
| auditable_type | VARCHAR(100) | NULLABLE | Polymorphic model name |
| auditable_id | BIGINT UNSIGNED | NULLABLE | Polymorphic model ID |
| old_values | JSON | NULLABLE | Before state |
| new_values | JSON | NULLABLE | After state |
| ip_address | VARCHAR(45) | NULLABLE | |
| user_agent | TEXT | NULLABLE | |
| created_at | TIMESTAMP | NOT NULL | |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `admin_id`
- INDEX: `(auditable_type, auditable_id)`
- INDEX: `action`
- INDEX: `created_at`

**Logged Actions:**
- `poll.created`
- `poll.opened`
- `poll.paused`
- `poll.closed`
- `poll.archived`
- `poll.deleted`
- `poll.duplicated`
- `poll.results_reset`
- `admin.login`
- `admin.logout`
- `admin.password_reset`

---

## 3. Entity Relationship Summary

```
admins
  └── polls (one admin → many polls)
        ├── poll_options (one poll → 2–10 options)
        ├── votes (one poll → many votes)
        │     └── vote_options (one vote → one or more options)
        └── voter_sessions (one poll → many sessions)

audit_logs
  └── linked to admins (nullable)
  └── polymorphic link to any model
```

---

## 4. Normalization Review

- **admins**: 3NF — no repeating groups, no partial or transitive dependencies
- **polls**: 3NF — `total_votes` is intentionally denormalized for read performance; updated via DB transaction when a vote is cast
- **poll_options**: 3NF — `vote_count` is denormalized for the same reason
- **votes**: 3NF — `voter_token` stores a hash, not raw fingerprint data
- **vote_options**: Pure pivot — correctly separates the many-to-many relationship
- **voter_sessions**: 3NF — session tracking is separate from the vote record
- **audit_logs**: Uses polymorphic design to avoid one audit table per model

---

## 5. Scalability Considerations

- `total_votes` and `vote_count` are denormalized counters to avoid expensive COUNT() queries on the results page under high load
- Both counters must be updated atomically using DB increment inside a transaction when a vote is submitted
- `voter_sessions.expires_at` allows a scheduled job to purge stale session records
- `votes` table will grow large over time — partition by `poll_id` or archive old polls
- Add a read replica for the results query path if concurrency exceeds 2,000 voters
- `audit_logs` should be moved to a separate database or log service at large scale

---

## 6. Room Code Generation Rules

- 6 characters, uppercase alphanumeric
- Exclude ambiguous characters: `0`, `O`, `1`, `I`, `L`
- Check uniqueness against `polls.room_code` before saving
- Retry up to 5 times on collision before throwing an error
