# 03 · Database (MySQL 8)

> Part of the [Vote Showdown source of truth](README.md). Models/relations consumed in [`04-backend.md`](04-backend.md).

## ERD

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    users     │         │    polls     │         │ poll_options │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id (PK)      │1      * │ id (PK)      │1      * │ id (PK)      │
│ name         │────────<│ creator_id FK│────────<│ poll_id FK   │
│ email (UQ)   │         │ title        │         │ label        │
│ password     │         │ description  │         │ color_class  │
│ role (enum)  │         │ allow_multiple│        │ badge_color… │
│ avatar_text  │         │ status (enum)│         │ position     │
│ avatar_bg…   │         │ duration_sec │         └──────┬───────┘
└──────┬───────┘         │ starts_at    │                │1
       │1                │ ends_at      │                │
       │                 └──────┬───────┘                │
       │                        │1                       │
       │                        │                        │
       │            *           ▼            *           ▼
       └──────────────────────< votes >──────────────────┘
                        ├──────────────┤
                        │ id (PK)      │
                        │ poll_id FK   │
                        │ poll_option_id FK
                        │ user_id FK   │
                        │ created_at   │
                        │ UNIQUE(...)  │  ← dedupe, see below
                        └──────────────┘
```

Plus Laravel's standard tables: `password_reset_tokens`, `sessions`, `cache`, `jobs`/`job_batches`/`failed_jobs`.

## Design notes (the decisions that matter)

- **Tallies are derived, not stored as the source of truth.** A poll option's vote count = `COUNT(votes WHERE poll_option_id = ?)`. For the live UI we expose it via `withCount` / a cached counter, but the `votes` rows are canonical. This makes the prototype's `count: number` on each option a *read model*, never a writable field.
- **Voters are not user accounts (D19).** A vote carries a canonical `voter_key` identifying any voter — `user:{id}` (authenticated), `email:{email}` (guest by email), or `token:{token}` (guest by device, the email fallback). `votes.user_id` is nullable (set only for authenticated voters); guest identity lives in `voter_email` / `voter_name` / `voter_token` on the vote. Public guest voting no longer creates `is_guest` users.
- **Dedupe via a unique index, enforced by the DB.** One vote per `(poll_id, poll_option_id, voter_key)`; the single-choice rule (one vote per `(poll_id, voter_key)`) is additionally enforced by a per-`voter_key`-per-poll `Cache::lock` in `VoteService` (a partial unique index isn't portable to MySQL, so the app layer guards it — see [`modules/voting.md`](modules/voting.md)).
- **Timer is server-authoritative.** `polls.ends_at` is the truth; the client only renders the remaining seconds. `duration_seconds` is the configured length used to compute `ends_at` at launch. The prototype's client `timerSeconds` becomes display-only.
- **Roles live on `users.role`** (enum), not a separate table — three fixed roles, no dynamic permissions needed. See [`06-auth-and-roles.md`](06-auth-and-roles.md).
- **Cosmetic fields are persisted** (`color_class`, `badge_color_class`, `avatar_text`, `avatar_bg_color`) so the brutalist look from the prototype survives a round-trip. Seeded from `src/data.ts`.
- **Public poll identity is a UUID, internal identity stays a bigint (D15).** `polls.uuid` (unique, indexed) is the route key (`getRouteKeyName() => 'uuid'`) and the value exposed across the Inertia boundary and broadcast channels (`poll.{uuid}`). The `bigint` `id` and all foreign keys (`poll_options.poll_id`, `votes.poll_id`, `poll_visits.poll_id`) remain integer for performance — only the *public* identifier is the UUID, so sequential ids never leak in URLs/QRs.
- **Visit statistics are derived from `poll_visits`, backed by a denormalized counter (D17).** Each recorded access is a `poll_visits` row (deduped one-per-session-per-poll, IP stored only as a salted hash — no raw PII). `polls.visits_count` is a denormalized total for cheap reads; unique visitors and visit→vote conversion come from the rows. Backend/admin surfacing only — there is no public visit UI.

## Migrations `[new]`

Order matters (FKs). One migration per table.

### `users` (extend Laravel default)

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->enum('role', ['admin', 'creator'])->default('creator'); // D19/D20: no "invitee"/Voter role
    $table->string('avatar_text', 4)->nullable();         // e.g. "JD"
    $table->string('avatar_bg_color')->default('bg-[#9cf0ff]');
    $table->boolean('is_demo')->default(false)->index();  // seed/demo voters, purgeable (M1)
    $table->boolean('is_guest')->default(false)->index(); // claimable email-only account from guest voting (D8)
    $table->rememberToken();
    $table->timestamps();
});
```

### `polls`

```php
Schema::create('polls', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique();                            // public route key (D15); int id stays internal
    $table->unsignedInteger('visits_count')->default(0);       // denormalized visit total (D17)
    $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
    $table->string('title');
    $table->text('description')->nullable();
    $table->boolean('allow_multiple')->default(false);
    $table->enum('status', ['draft', 'active', 'ended'])->default('draft')->index();

    // Optional access gate (D9). Null = open (vote anytime); set = hashed password the
    // voter must enter once before voting.
    $table->string('access_password')->nullable();

    // End mode: a relative countdown OR an absolute deadline. Either way ends_at is the
    // single server-authoritative end the app reads from.
    $table->enum('end_mode', ['duration', 'deadline'])->default('duration');
    $table->unsignedInteger('duration_seconds')->nullable();   // used when end_mode = duration
    $table->timestamp('deadline_at')->nullable();              // used when end_mode = deadline (creator-chosen)

    $table->timestamp('starts_at')->nullable();
    $table->timestamp('ends_at')->nullable()->index();         // resolved authoritative end
    $table->timestamps();
});
```

**End mode (deadline vs duration).** A poll ends either after a relative **countdown** (`duration_seconds`, ends_at computed at launch) or at an absolute **deadline date/time** (`deadline_at`, chosen by the creator). `ends_at` is always the resolved truth the rest of the app reads (`isActive`, `remainingSeconds`, the scheduler sweep, broadcasts) — so adding deadlines required no change to those consumers, only how `ends_at` is set:
- `duration` → `ends_at = starts_at + duration_seconds` (set on launch).
- `deadline` → `ends_at = deadline_at` (a deadline poll may even be launched with a fixed future end independent of when it started).

### `poll_options`

```php
Schema::create('poll_options', function (Blueprint $table) {
    $table->id();
    $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
    $table->string('label');
    $table->string('color_class')->default('bg-[#00e3fd]');
    $table->string('badge_color_class')->default('bg-[#00e3fd] text-[#1b1b1b]');
    $table->string('image_path')->nullable();              // uploaded image (D10), shown on the option card
    $table->string('icon')->nullable();                    // OR a named lucide icon (D10)
    $table->unsignedSmallInteger('position')->default(0);  // display order (old "01","02")
    $table->timestamps();
    $table->index(['poll_id', 'position']);
});
```

### `votes`

```php
Schema::create('votes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
    $table->foreignId('poll_option_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->timestamps();

    // Hard dedupe for multiple-choice; single-choice additionally guarded in VoteService.
    $table->unique(['poll_id', 'poll_option_id', 'user_id']);
    $table->index(['poll_id', 'poll_option_id']);          // fast tally
});
```

### `poll_visits` `[new]` (D17)

Backend/admin visit statistics. One row per recorded access, deduped one-per-session-per-poll.

```php
Schema::create('poll_visits', function (Blueprint $table) {
    $table->id();
    $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // null for logged-out guests
    $table->string('ip_hash', 64)->nullable();             // salted hash only — never raw IP (R13)
    $table->string('user_agent')->nullable();
    $table->timestamp('visited_at')->index();
    $table->index(['poll_id', 'visited_at']);
});
```

> **Additive migrations.** `polls.uuid` (D15), `polls.visits_count` (D17), and `poll_visits` (D17) ship as new follow-on migrations (with a uuid backfill for existing rows), not by rewriting the original `create_polls` migration. The blocks above show the resulting target schema.

## Field mapping: prototype → schema

| Prototype (`src/types.ts`, `src/data.ts`) | Schema |
|---|---|
| `Poll.id` (string like `best_pizza`) | `polls.id` (bigint PK); keep a slug only if URLs need it |
| `Poll.title` / `description` / `allowMultiple` / `status` / `durationSeconds` | `polls.title` / `description` / `allow_multiple` / `status` / `duration_seconds` |
| `Poll.createdAt` | `polls.created_at` |
| `PollOption.id` (`"01"`) | `poll_options.position` |
| `PollOption.text` | `poll_options.label` |
| `PollOption.count` | derived from `votes` (read model only) |
| `PollOption.colorClass` / `badgeColorClass` | `poll_options.color_class` / `badge_color_class` |
| `Voter.name/email/avatarText/avatarBgColor` | `users.*` (invitees are real users now) |
| `Voter.votedOptionText` / `timestamp` | a `votes` row joined to its option / `votes.created_at` |

## Seeders `[prototype]`

- **`DefaultPollsSeeder`** ports `defaultPolls` from `src/data.ts` (Best Pizza Topping, Utility Belt, Pizza Tacos) including option colors and starting counts. Because the tally is derived (no count column), seeded counts require real `votes` rows — which require users.
  - **Avoid user-table pollution (risk M1):** generate the demo voters as a clearly-tagged batch (e.g. a `is_demo` boolean flag, or a dedicated email domain like `@demo.showdown`) so hundreds of seed users don't masquerade as real accounts and can be purged in one query. Seed this **only in local/staging**, never in production.
- **`UserSeeder`** creates a single Super Admin (`superadmin@…` or the configured email) so the app is manageable from a fresh install — dev/bootstrap only. Other accounts are created via User Management.
- Wire both into `DatabaseSeeder`.

## Factories `[new]`

`UserFactory` (default role creator; states `->admin()`, `->creator()`, `->demo()`), `PollFactory` (states `->active()`, `->ended()`, `->draft()`), `PollOptionFactory`, `VoteFactory`. Used by seeders and Pest tests.
