# Development Roadmap
# QR Voting Application

**Total Estimated Hours:** 160–200 hours  
**Team:** 1 Full-Stack Developer (or split across backend + frontend)

---

## Phase 1 — Project Setup
**Estimated:** 8–10 hours

### Tasks
- Initialize Laravel 12 project with PHP 8.3
- Configure MySQL 8 database connection
- Set up Laravel Sanctum for API authentication
- Initialize React 19 project with TypeScript
- Configure Tailwind CSS and shadcn/ui
- Set up React Router v6
- Set up Zustand for state management
- Configure environment files (.env) for local development
- Set up Git repository and branch strategy (main, develop, feature/*)
- Configure ESLint, Prettier, and PHP CS Fixer

### Risks
- shadcn/ui component compatibility with React 19 — verify before building

### Dependencies
- None — this is the starting point

---

## Phase 2 — Database
**Estimated:** 8–10 hours

### Tasks
- Write migrations for: `admins`, `polls`, `poll_options`, `votes`, `vote_options`, `voter_sessions`, `audit_logs`
- Add all indexes and foreign keys
- Write seeders: admin account, sample poll data
- Write Eloquent models with relationships
- Write model factories for testing
- Verify all constraints work correctly

### Risks
- Unique index on `(poll_id, voter_token)` must handle concurrent inserts — test under load

### Dependencies
- Phase 1 complete

---

## Phase 3 — Backend API
**Estimated:** 50–60 hours

### 3.1 Authentication (8 hrs)
- Login endpoint
- Logout endpoint
- Forgot password + reset password
- Auth middleware guard
- Rate limiting on auth routes

### 3.2 Poll CRUD (12 hrs)
- Create poll with options
- List polls (filterable)
- Get single poll
- Update poll (draft only)
- Soft delete poll
- Room code generation logic
- Voting URL generation logic
- QR code generation (use `simplesoftwareio/simple-qrcode` or `bacon/bacon-qr-code`)

### 3.3 Poll Lifecycle (8 hrs)
- Open, pause, close, archive endpoints
- Status transition validation (e.g., cannot open an archived poll)
- Audit log entry on every status change

### 3.4 Poll Operations (6 hrs)
- Duplicate poll
- Reset poll results (delete votes + reset counts in transaction)
- Audit log entries for all operations

### 3.5 Voting (12 hrs)
- Room code validation endpoint
- Submit vote endpoint
- Duplicate vote prevention (unique constraint + voter_session check)
- Atomic vote count increment
- Check-if-voted endpoint
- Rate limiting on vote endpoint

### 3.6 Results (6 hrs)
- Public results endpoint (vote count + percentage)
- Admin results endpoint (with metadata)
- Percentage calculation logic

### 3.7 API Polish (8 hrs)
- Consistent error response formatting
- Form Request validation classes
- API resource classes for response shaping
- Postman/Insomnia collection export

### Risks
- Race conditions on vote submission — mitigated by unique DB constraint + atomic increment
- QR code library choices may differ in output quality — test on mobile scanners

### Dependencies
- Phase 2 complete

---

## Phase 4 — Frontend
**Estimated:** 55–65 hours

### 4.1 Auth Pages (8 hrs)
- Login page
- Forgot password page
- Reset password page
- Auth store (Zustand)
- Protected route wrapper

### 4.2 Admin Dashboard + Poll List (8 hrs)
- Dashboard overview page
- Poll list with status filters
- Poll status badge component
- Empty state component

### 4.3 Poll Create + Edit (12 hrs)
- Poll creation form (title, description, type, options)
- Dynamic option add/remove (min 2, max 10)
- Display order drag-and-drop (optional — nice to have)
- Validation feedback
- Poll edit page (draft only)

### 4.4 Poll Detail Page (8 hrs)
- QR code display + download button
- Room code display + copy button
- Voting URL display + copy button
- Poll lifecycle action buttons (open, pause, close, archive)
- Confirm dialogs for destructive actions

### 4.5 Voter Flow (12 hrs)
- Room code entry page
- Voting page (single and multiple choice)
- Vote submission logic
- Voter token generation (`useVoterToken` hook)
- Already-voted detection (check localStorage + API)
- Vote confirmation page

### 4.6 Results Dashboard (10 hrs)
- Live results page (admin)
- Bar chart (Recharts)
- Percentage bars
- Leaderboard ranking
- Auto-refresh (3-second polling via `useLiveResults`)
- Projector/fullscreen mode

### 4.7 Polish (7 hrs)
- Loading states and spinners
- Error boundaries
- Toast notifications for actions
- Responsive layout (mobile-first)
- Keyboard navigation and basic accessibility

### Risks
- Recharts bundle size — consider lazy loading the results page
- Fingerprint generation accuracy varies by browser — test on iOS Safari

### Dependencies
- Phase 3 complete (or use mock API responses during frontend dev)

---

## Phase 5 — Real-Time Features
**Estimated:** 10–15 hours

### For MVP (up to 500 voters): HTTP Polling
- `useLiveResults` hook polls every 3 seconds
- Stop polling when poll is closed
- No additional backend work needed

### For Scale (500–2,000 voters): Server-Sent Events (SSE)
- Laravel SSE endpoint using `StreamedResponse`
- Client subscribes to `EventSource` URL
- Backend broadcasts result update when vote is submitted
- Estimated: +10 hours over polling approach

### For Large Scale (2,000–10,000 voters): Laravel Reverb (WebSockets)
- Install and configure Laravel Reverb
- Create `VoteSubmitted` broadcast event
- React client uses Laravel Echo + Pusher JS
- Requires a separate Reverb server process on VPS
- Estimated: +20 hours over polling approach

### Recommendation
**Start with HTTP polling for MVP.** Migrate to SSE or Reverb only when live testing shows lag is noticeable. The `useLiveResults` hook abstracts the transport — only the hook internals change, not the components.

### Risks
- SSE connections count against server connection limits — monitor under load
- Reverb requires WebSocket port open on VPS firewall (port 8080 or 6001)

### Dependencies
- Phase 3 and Phase 4 complete

---

## Phase 6 — Testing
**Estimated:** 20–25 hours

### Backend Testing (Laravel)
- Feature tests for all API endpoints
- Unit tests for: vote submission logic, room code generation, fingerprint token handling, status transition validation
- Database tests: unique constraint enforcement, atomic increment
- Authentication tests: login, logout, password reset

### Frontend Testing
- Component tests (Vitest + React Testing Library)
- Hook tests: `useVoterToken`, `useLiveResults`
- E2E tests (Playwright): full voter flow, admin poll lifecycle

### Manual QA
- QR code scanning on iOS Safari, Android Chrome
- Duplicate vote attempt testing
- Multiple browser tab simultaneous vote submissions
- Mobile layout across screen sizes

### Risks
- E2E test setup for QR scanning requires a physical device — simulate via direct URL instead

### Dependencies
- Phase 4 complete

---

## Phase 7 — Deployment
**Estimated:** 10–15 hours

### Server Setup (Linux VPS)
- Install PHP 8.3, Composer, Node.js, MySQL 8
- Install and configure Nginx
- Set up SSL with Let's Encrypt (Certbot)
- Configure `.env` for production
- Set `APP_DEBUG=false`, `APP_ENV=production`

### Application Deployment
- Set up deployment pipeline (GitHub Actions or Deployer.php)
- Run migrations on production
- Run seeders (admin account)
- Build React frontend (`npm run build`)
- Point Nginx to the React build `/dist` folder

### Background Jobs
- Configure Laravel queue worker (for emails, audit log processing)
- Set up cron job for `php artisan schedule:run` (for session cleanup)

### Monitoring
- Set up basic server monitoring (CPU, memory, disk)
- Configure Laravel log rotation
- Set up uptime monitoring (e.g., UptimeRobot)

### Risks
- MySQL 8 strict mode may cause migration issues — test locally with strict mode enabled
- QR code image storage — ensure `/storage/app/public` is linked and Nginx serves it correctly

### Dependencies
- Phase 6 complete and all tests passing

---

## Summary Table

| Phase | Name | Hours |
|---|---|---|
| 1 | Project Setup | 8–10 |
| 2 | Database | 8–10 |
| 3 | Backend API | 50–60 |
| 4 | Frontend | 55–65 |
| 5 | Real-Time | 10–15 |
| 6 | Testing | 20–25 |
| 7 | Deployment | 10–15 |
| **Total** | | **161–200** |
