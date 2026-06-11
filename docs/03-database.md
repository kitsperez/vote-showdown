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
- **Dedupe via a unique index, enforced by the DB.** Single-choice polls: one vote per `(poll_id, user_id)`. Multiple-choice polls: one vote per `(poll_id, poll_option_id, user_id)`. We use the broader unique index `UNIQUE(poll_id, poll_option_id, user_id)` and additionally enforce the single-choice rule in `VoteService` (a partial unique index on `(poll_id,user_id)` isn't portable to MySQL, so the app layer guards it — see [`modules/voting.md`](modules/voting.md)).
- **Timer is server-authoritative.** `polls.ends_at` is the truth; the client only renders the remaining seconds. `duration_seconds` is the configured length used to compute `ends_at` at launch. The prototype's client `timerSeconds` becomes display-only.
- **Roles live on `users.role`** (enum), not a separate table — three fixed roles, no dynamic permissions needed. See [`06-auth-and-roles.md`](06-auth-and-roles.md).
- **Cosmetic fields are persisted** (`color_class`, `badge_color_class`, `avatar_text`, `avatar_bg_color`) so the brutalist look from the prototype survives a round-trip. Seeded from `src/data.ts`.

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
    $table->enum('role', ['admin', 'creator', 'invitee'])->default('invitee');
    $table->string('avatar_text', 4)->nullable();         // e.g. "JD"
    $table->string('avatar_bg_color')->default('bg-[#9cf0ff]');
    $table->boolean('is_demo')->default(false)->index();  // seed/demo voters, purgeable (M1)
    $table->rememberToken();
    $table->timestamps();
});
```

### `polls`

```php
Schema::create('polls', function (Blueprint $table) {
    $table->id();
    $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
    $table->string('title');
    $table->text('description')->nullable();
    $table->boolean('allow_multiple')->default(false);
    $table->enum('status', ['draft', 'active', 'ended'])->default('draft')->index();
    $table->unsignedInteger('duration_seconds')->default(120);
    $table->timestamp('starts_at')->nullable();
    $table->timestamp('ends_at')->nullable()->index();     // server-authoritative end
    $table->timestamps();
});
```

### `poll_options`

```php
Schema::create('poll_options', function (Blueprint $table) {
    $table->id();
    $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
    $table->string('label');
    $table->string('color_class')->default('bg-[#00e3fd]');
    $table->string('badge_color_class')->default('bg-[#00e3fd] text-[#1b1b1b]');
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
- **`UserSeeder`** creates one of each role for local login (`admin@…`, `creator@…`, `invitee@…`) — credentials documented in the seeder, dev-only.
- Wire both into `DatabaseSeeder`.

## Factories `[new]`

`UserFactory` (with `role` states: `->admin()`, `->creator()`, `->invitee()`), `PollFactory` (states `->active()`, `->ended()`, `->draft()`), `PollOptionFactory`, `VoteFactory`. Used by seeders and Pest tests.
