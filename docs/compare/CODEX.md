# CODEX.md
# QR Voting Application — Developer Reference

> Read this before touching any code. This is the single source of truth for how this project is structured, built, and maintained.

---

## 1. Project Overview

A web-based voting platform where administrators create polls and voters participate by scanning a QR code or entering a room code. Voters do not need an account. Voting is anonymous. The system prevents duplicate votes using a three-layer fingerprint strategy. Admins manage the full poll lifecycle and monitor live results in real time.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend language | PHP | 8.3 |
| Backend framework | Laravel | 12 |
| Database | MySQL | 8 |
| Auth | Laravel Sanctum | latest |
| QR Code | bacon/bacon-qr-code | latest |
| Frontend framework | React | 19 |
| Frontend language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui | latest |
| State management | Zustand | latest |
| Routing | React Router | v6 |
| Charts | Recharts | latest |
| HTTP client | Axios | latest |
| Testing (backend) | Pest | latest |
| Testing (frontend) | Vitest + React Testing Library | latest |
| E2E testing | Playwright | latest |
| Server | Linux VPS + Nginx | — |
| SSL | Let's Encrypt (Certbot) | — |

---

## 3. Project Structure

### Backend (Laravel)

```
/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/               # Login, logout, password reset
│   │   │   ├── Admin/              # Poll CRUD, lifecycle, results
│   │   │   └── Voter/              # Room code access, vote submission
│   │   ├── Requests/               # Form validation classes (one per endpoint)
│   │   ├── Resources/              # API response transformers
│   │   └── Middleware/             # Rate limiting, auth guards
│   ├── Models/                     # Eloquent models
│   ├── Services/                   # Business logic (VoteService, PollService)
│   ├── Events/                     # Broadcast events (VoteSubmitted)
│   └── Listeners/                  # Event listeners
├── database/
│   ├── migrations/                 # One file per table
│   ├── seeders/                    # AdminSeeder, SamplePollSeeder
│   └── factories/                  # Model factories for testing
├── routes/
│   ├── api.php                     # All API routes
│   └── web.php                     # Only used for password reset redirect
├── storage/
│   └── app/public/qrcodes/         # Generated QR code images
├── tests/
│   ├── Feature/                    # API endpoint tests
│   └── Unit/                       # Service and logic tests
└── .env                            # Environment config (never commit)
```

### Frontend (React)

```
src/
├── api/                            # Typed API call functions
│   ├── auth.ts
│   ├── polls.ts
│   ├── voting.ts
│   └── results.ts
├── components/
│   ├── ui/                         # shadcn/ui base components
│   ├── layout/                     # AdminLayout, VoterLayout, Navbar
│   ├── polls/                      # PollCard, PollStatusBadge, QRCodeDisplay
│   ├── results/                    # ResultsBarChart, ResultsLeaderboard
│   └── shared/                     # ConfirmDialog, LoadingSpinner, ErrorMessage
├── pages/
│   ├── auth/                       # Login, ForgotPassword, ResetPassword
│   ├── admin/                      # Dashboard, PollList, PollCreate, PollDetail, Results
│   ├── voter/                      # RoomCodeEntry, Voting, VoteConfirmation
│   └── public/                     # ProjectorResults, NotFound
├── hooks/                          # useAuth, usePoll, useVote, useLiveResults, useVoterToken
├── store/                          # Zustand stores: authStore, pollStore, voterStore
├── types/                          # TypeScript interfaces for all models
├── utils/                          # fingerprint.ts, tokenStorage.ts, formatters.ts
└── router/index.tsx                # All route definitions
```

---

## 4. Local Development Setup

### Prerequisites
- PHP 8.3
- MySQL 8

### Backend Setup

```
1. Clone the repository
2. cd into the backend folder
3. Run: composer install
4. Copy .env.example to .env
5. Fill in DB credentials and APP_KEY in .env
6. Run: php artisan key:generate
7. Run: php artisan migrate
8. Run: php artisan db:seed
9. Run: php artisan storage:link
10. Run: php artisan serve
```

### Frontend Setup

```
1. cd into the frontend folder
2. Run: npm install
3. Copy .env.example to .env
4. Set VITE_API_BASE_URL to your Laravel local URL
5. Run: npm run dev
```

### Verify Setup
- Backend API available at: `http://localhost:8000/api/v1`
- Frontend available at: `http://localhost:5173`
- Default admin account: seeded via `AdminSeeder` (see `.env.example` for credentials)

---

## 5. Environment Variables

### Backend (.env)

| Key | Required | Example | Purpose |
|---|---|---|---|
| `APP_NAME` | Yes | `QR Voting` | App display name |
| `APP_ENV` | Yes | `local` | Environment mode |
| `APP_KEY` | Yes | generated | Encryption key |
| `APP_DEBUG` | Yes | `true` (local), `false` (prod) | Show errors |
| `APP_URL` | Yes | `http://localhost:8000` | Base URL |
| `DB_HOST` | Yes | `127.0.0.1` | Database host |
| `DB_PORT` | Yes | `3306` | Database port |
| `DB_DATABASE` | Yes | `qr_voting` | Database name |
| `DB_USERNAME` | Yes | `root` | Database user |
| `DB_PASSWORD` | Yes | `secret` | Database password |
| `SANCTUM_STATEFUL_DOMAINS` | Yes | `localhost:5173` | Allowed SPA origins |
| `MAIL_MAILER` | Yes | `smtp` | Mail driver |
| `MAIL_HOST` | Yes | `smtp.mailtrap.io` | SMTP host |
| `MAIL_PORT` | Yes | `587` | SMTP port |
| `MAIL_USERNAME` | Yes | — | SMTP user |
| `MAIL_PASSWORD` | Yes | — | SMTP password |
| `MAIL_FROM_ADDRESS` | Yes | `noreply@app.com` | From address |
| `QUEUE_CONNECTION` | No | `sync` (local), `database` (prod) | Queue driver |
| `SESSION_LIFETIME` | No | `480` | Session timeout in minutes |

### Frontend (.env)

| Key | Required | Example | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:8000/api/v1` | API base URL |
| `VITE_APP_NAME` | No | `QR Voting` | App display name |

---

## 6. Coding Standards & Conventions

### PHP / Laravel
- **Classes:** PascalCase — `PollController`, `VoteService`
- **Methods:** camelCase — `submitVote()`, `generateRoomCode()`
- **Variables:** camelCase — `$pollId`, `$voterToken`
- **Database columns:** snake_case — `poll_id`, `voter_token`, `created_at`
- **Routes:** kebab-case — `/admin/poll-options`, `/vote/room-code`
- **One controller per resource** — do not put voter logic in admin controllers
- **All business logic goes in Services** — controllers are thin, they call services
- **All request validation goes in Form Request classes** — never validate in controllers
- **All API responses go through Resource classes** — never return raw Eloquent models

### TypeScript / React
- **Components:** PascalCase files and function names — `PollCard.tsx`
- **Hooks:** camelCase with `use` prefix — `useVoterToken.ts`
- **Store files:** camelCase with `Store` suffix — `authStore.ts`
- **Type files:** camelCase with `.types.ts` suffix — `poll.types.ts`
- **All props must be typed** — no `any` types allowed
- **No inline styles** — use Tailwind classes only
- **No `dangerouslySetInnerHTML`** — ever

### Database
- All tables use `id` as primary key (BIGINT UNSIGNED, AUTO_INCREMENT)
- All tables have `created_at` and `updated_at` timestamps
- Soft-deletable tables have `deleted_at`
- Foreign key column names match the pattern: `{table_singular}_id`
- All indexes named explicitly: `idx_{table}_{column}`

### Git
- **Branch naming:**
  - `feature/poll-creation`
  - `fix/duplicate-vote-bug`
  - `chore/update-dependencies`
  - `hotfix/room-code-validation`
- **Commit format:** `type: short description`
  - `feat: add poll duplication endpoint`
  - `fix: prevent duplicate vote on concurrent request`
  - `chore: add migration for voter_sessions`
  - `test: add vote submission feature test`
- **Never commit directly to `main`**
- **`main`** = production-ready only
- **`develop`** = integration branch
- Feature branches merge into `develop` via pull request

---

## 7. Architecture Decisions

### Why Sanctum over Passport?
This app only needs token-based authentication for a simple admin SPA. Passport adds OAuth complexity that is not needed here. Sanctum is the correct choice for first-party SPA authentication.

### Why Zustand over Redux?
Redux adds boilerplate that is unnecessary for an app of this size. Zustand provides the same global state with a fraction of the setup. If the app grows significantly, migration to Redux Toolkit is straightforward.

### Why HTTP Polling over WebSockets for MVP?
Setting up Laravel Reverb or a WebSocket server adds infrastructure complexity. For up to 500 concurrent voters, polling the results endpoint every 3 seconds is sufficient and reliable. The `useLiveResults` hook abstracts the transport layer — upgrading to SSE or Reverb only requires changing the hook internals, not the components.

### Real-time upgrade path by scale:
- **Up to 500 voters:** HTTP polling every 3 seconds
- **500–2,000 voters:** Server-Sent Events (SSE) via Laravel `StreamedResponse`
- **2,000–10,000 voters:** Laravel Reverb (WebSockets) with a dedicated process

### Why denormalized vote counts?
`polls.total_votes` and `poll_options.vote_count` are maintained as counters rather than computed via `COUNT()` on every results request. This prevents expensive aggregation queries under high read load. Both counters are updated atomically inside a database transaction when a vote is submitted.

### Why a separate `vote_options` pivot table?
A single `votes` table with a column for option IDs would require serialized arrays or JSON, making queries complex and indexes ineffective. The `vote_options` pivot supports both single and multiple-choice polls cleanly with standard relational queries.

---

## 8. Key Business Rules

These rules must always be enforced. They are validated at both the API and database levels.

| Rule | Where Enforced |
|---|---|
| A poll must have minimum 2 options | Form Request validation + DB check in PollService |
| A poll must have maximum 10 options | Form Request validation |
| A poll can only be edited when status is `draft` | PollService status check before update |
| A voter can only vote once per poll | UNIQUE(poll_id, voter_token) DB constraint |
| Single-choice polls accept exactly 1 option_id | Form Request validation |
| Multiple-choice polls accept 1 or more option_ids | Form Request validation |
| Only options belonging to the poll can be selected | VoteService validates option ownership |
| Vote counts must update atomically | DB transaction with increment — never raw update |
| All admin poll actions must be logged | AuditLog entry created in every PollService method |
| Admins can only manage their own polls | All admin queries scoped by `admin_id = auth()->id()` |

### Poll Status Transition Rules

```
draft → active       (open)
active → paused      (pause)
active → closed      (close)
paused → active      (reopen)
paused → closed      (close)
closed → archived    (archive)
closed → active      (reopen — resets nothing, just reopens)
any status → deleted (soft delete — admin only)
```

Attempting an invalid transition returns HTTP `422` with a descriptive message.

---

## 9. API Conventions

**Base URL:** `/api/v1`

**Authentication:** Bearer token in `Authorization` header
```
Authorization: Bearer {token}
```

**Standard success response:**
```json
{
  "data": { },
  "message": "Optional success message"
}
```

**Standard error response:**
```json
{
  "message": "Human-readable error description",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

**Pagination format:**
```json
{
  "data": [ ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 72
  }
}
```

**HTTP status codes used:**

| Code | When |
|---|---|
| 200 | Successful GET, PUT, POST (non-create) |
| 201 | Successful resource creation |
| 401 | Unauthenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict — e.g., duplicate vote |
| 422 | Validation failure |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

**Rate limits:**

| Endpoint | Limit |
|---|---|
| POST /auth/login | 5 / min per IP |
| POST /polls/:code/vote | 3 / min per IP |
| GET /polls/*/results | 30 / min per IP |
| All admin endpoints | 60 / min per token |

---

## 10. Database Conventions

- All primary keys: `id BIGINT UNSIGNED AUTO_INCREMENT`
- All tables have: `created_at TIMESTAMP`, `updated_at TIMESTAMP`
- Soft-deletable models have: `deleted_at TIMESTAMP NULL`
- Foreign keys always cascade on delete unless there is a business reason not to
- Vote counts (`total_votes`, `vote_count`) are denormalized — always updated via `DB::table()->increment()` inside a transaction, never via Eloquent `save()`
- Room codes are 6-character uppercase alphanumeric, excluding ambiguous characters: `0`, `O`, `1`, `I`, `L`
- All audit log entries are written by `AuditLogService::log()` — never write directly to the table from a controller

---

## 11. Testing

### Run backend tests
```
php artisan test
```

### Run frontend tests
```
npm run test
```

### Run E2E tests
```
npx playwright test
```

### What requires a test before merging:
- Every new API endpoint needs a Feature test
- Every Service method needs a Unit test
- Every React hook needs a hook test
- The full voter flow (enter room code → vote → confirm) must have an E2E test
- The duplicate vote prevention logic must have a concurrency test

---

## 12. Deployment

Deployment targets a Linux VPS running Nginx + PHP 8.3 + MySQL 8.

Quick deploy steps:
```
1. Push to main branch
2. SSH into VPS
3. Pull latest: git pull origin main
4. Install dependencies: composer install --no-dev
5. Run migrations: php artisan migrate --force
6. Build frontend: npm run build
7. Restart queue worker: php artisan queue:restart
8. Clear cache: php artisan optimize
```

Full deployment details are in `ROADMAP.md` → Phase 7.

**Critical production checklist:**
- `APP_DEBUG=false`
- `APP_ENV=production`
- Storage linked: `php artisan storage:link`
- SSL active and auto-renewing
- Database not exposed to public internet
- `.env` not in version control

---

## 13. Document Index

| Document | Purpose |
|---|---|
| `PRD.md` | What the app does, MVP scope, all requirements |
| `DATABASE_DESIGN.md` | All tables, columns, indexes, relationships |
| `API_DESIGN.md` | Every endpoint with request and response payloads |
| `FRONTEND_ARCHITECTURE.md` | Folder structure, pages, hooks, state, routing |
| `SECURITY.md` | Duplicate vote strategy, rate limits, all security concerns |
| `USER_STORIES.md` | What admins and voters need, in plain language |
| `ROADMAP.md` | Phased plan with hours, risks, and dependencies |
| `QA_TEST_PLAN.md` | All test cases, load tests, and pre-launch checklist |
| `CODEX.md` | This file — read first |
