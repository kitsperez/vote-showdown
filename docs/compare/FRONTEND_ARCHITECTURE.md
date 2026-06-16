# Frontend Architecture
# QR Voting Application

**Stack:** React 19, TypeScript, Tailwind CSS, shadcn/ui  
**Version:** 1.0

---

## 1. Folder Structure

```
src/
├── api/                    # API client functions
│   ├── auth.ts
│   ├── polls.ts
│   ├── voting.ts
│   └── results.ts
│
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui base components (Button, Input, etc.)
│   ├── layout/
│   │   ├── AdminLayout.tsx
│   │   ├── VoterLayout.tsx
│   │   └── Navbar.tsx
│   ├── polls/
│   │   ├── PollCard.tsx
│   │   ├── PollStatusBadge.tsx
│   │   ├── PollOptionItem.tsx
│   │   └── QRCodeDisplay.tsx
│   ├── results/
│   │   ├── ResultsBarChart.tsx
│   │   ├── ResultsLeaderboard.tsx
│   │   └── ResultsPercentageBar.tsx
│   └── shared/
│       ├── ConfirmDialog.tsx
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
│
├── pages/                  # Route-level page components
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── admin/
│   │   ├── DashboardPage.tsx
│   │   ├── PollListPage.tsx
│   │   ├── PollCreatePage.tsx
│   │   ├── PollEditPage.tsx
│   │   ├── PollDetailPage.tsx
│   │   └── ResultsDashboardPage.tsx
│   ├── voter/
│   │   ├── RoomCodeEntryPage.tsx
│   │   ├── VotingPage.tsx
│   │   └── VoteConfirmationPage.tsx
│   └── public/
│       ├── ProjectorResultsPage.tsx
│       └── NotFoundPage.tsx
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── usePoll.ts
│   ├── useVote.ts
│   ├── useLiveResults.ts
│   ├── useVoterToken.ts
│   └── usePollManagement.ts
│
├── store/                  # State management (Zustand)
│   ├── authStore.ts
│   ├── pollStore.ts
│   └── voterStore.ts
│
├── types/                  # TypeScript interfaces
│   ├── auth.types.ts
│   ├── poll.types.ts
│   ├── vote.types.ts
│   └── api.types.ts
│
├── utils/                  # Helper functions
│   ├── fingerprint.ts      # Device fingerprint generation
│   ├── tokenStorage.ts     # Local storage token helpers
│   ├── formatters.ts       # Number, date formatters
│   └── constants.ts        # App-wide constants
│
├── router/
│   └── index.tsx           # React Router v6 route definitions
│
└── App.tsx
```

---

## 2. Pages

### Admin Pages

| Page | Route | Purpose |
|---|---|---|
| LoginPage | `/admin/login` | Admin email + password login |
| ForgotPasswordPage | `/admin/forgot-password` | Request reset email |
| ResetPasswordPage | `/admin/reset-password` | Set new password via token |
| DashboardPage | `/admin` | Overview: poll count, recent activity |
| PollListPage | `/admin/polls` | Filterable list of all polls |
| PollCreatePage | `/admin/polls/create` | Form to create a new poll |
| PollEditPage | `/admin/polls/:id/edit` | Edit draft poll |
| PollDetailPage | `/admin/polls/:id` | Poll details, QR code, room code, actions |
| ResultsDashboardPage | `/admin/polls/:id/results` | Live results + admin controls |

### Voter Pages

| Page | Route | Purpose |
|---|---|---|
| RoomCodeEntryPage | `/` | Enter room code manually |
| VotingPage | `/vote/:room_code` | Display poll and voting form |
| VoteConfirmationPage | `/vote/:room_code/done` | Thank you screen after voting |

### Public Pages

| Page | Route | Purpose |
|---|---|---|
| ProjectorResultsPage | `/results/:room_code/live` | Fullscreen live results for display |
| NotFoundPage | `*` | 404 fallback |

---

## 3. Routing Structure

```
/                          → RoomCodeEntryPage (public)
/vote/:room_code           → VotingPage (public)
/vote/:room_code/done      → VoteConfirmationPage (public)
/results/:room_code/live   → ProjectorResultsPage (public, fullscreen)

/admin                     → Protected route wrapper
  /admin/login             → LoginPage
  /admin/forgot-password   → ForgotPasswordPage
  /admin/reset-password    → ResetPasswordPage
  /admin/dashboard         → DashboardPage (auth required)
  /admin/polls             → PollListPage (auth required)
  /admin/polls/create      → PollCreatePage (auth required)
  /admin/polls/:id         → PollDetailPage (auth required)
  /admin/polls/:id/edit    → PollEditPage (auth required)
  /admin/polls/:id/results → ResultsDashboardPage (auth required)
```

**Route Guards:**
- `ProtectedRoute` component wraps all `/admin/dashboard` and deeper routes
- Checks `authStore` for a valid token
- Redirects to `/admin/login` if unauthenticated

---

## 4. State Management (Zustand)

### authStore
```
state:
  - admin: Admin | null
  - token: string | null
  - isAuthenticated: boolean

actions:
  - login(email, password)
  - logout()
  - loadFromStorage()
```

### pollStore
```
state:
  - polls: Poll[]
  - currentPoll: Poll | null
  - isLoading: boolean
  - error: string | null

actions:
  - fetchPolls()
  - fetchPoll(id)
  - createPoll(data)
  - updatePollStatus(id, status)
  - duplicatePoll(id)
  - deletePoll(id)
  - resetPollResults(id)
```

### voterStore
```
state:
  - currentPoll: PublicPoll | null
  - hasVoted: boolean
  - voterToken: string

actions:
  - loadPoll(room_code)
  - submitVote(room_code, option_ids)
  - checkIfVoted(room_code)
```

---

## 5. Custom Hooks

### useAuth
Wraps authStore. Exposes `login()`, `logout()`, `isAuthenticated`, and the current `admin`.

### usePoll(id)
Fetches and returns a single poll. Handles loading and error states.

### useVote(room_code)
Handles the voter flow: loading poll, checking if already voted, submitting vote.

### useLiveResults(room_code)
Polls the results endpoint every 3 seconds. Returns sorted options with percentages. Stops polling when poll status is `closed`.

### useVoterToken
Generates or retrieves the device fingerprint token from localStorage. Used to prevent duplicate votes client-side.

### usePollManagement(id)
Exposes poll lifecycle actions: open, pause, close, archive, duplicate, delete, reset.

---

## 6. Key Components

### PollCard
Displays a poll summary in the admin list view. Shows title, status badge, vote count, room code, and action buttons.

### QRCodeDisplay
Renders the QR code image for a poll. Includes a download button and a copy-link button.

### ResultsBarChart
Horizontal bar chart built with a lightweight library (Recharts). Animates on update when new votes come in.

### ResultsLeaderboard
Ranks options from highest to lowest vote count. Updates in real time.

### PollOptionItem (Voter View)
Radio button (single-choice) or checkbox (multiple-choice) item. Shows option label clearly.

### ConfirmDialog
Reusable confirmation modal for destructive actions (delete, reset results).

### PollStatusBadge
Color-coded badge: draft (gray), active (green), paused (yellow), closed (red), archived (slate).

---

## 7. TypeScript Interfaces

### Poll
```typescript
interface Poll {
  id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  type: 'single' | 'multiple';
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
  room_code: string;
  voting_url: string;
  qr_code_url: string | null;
  total_votes: number;
  options: PollOption[];
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
}
```

### PollOption
```typescript
interface PollOption {
  id: number;
  poll_id: number;
  label: string;
  vote_count: number;
  display_order: number;
  percentage?: number; // computed client-side
}
```

### Admin
```typescript
interface Admin {
  id: number;
  name: string;
  email: string;
}
```

---

## 8. API Client Pattern

All API calls go through typed wrapper functions in `src/api/`.

Each function:
- Accepts typed parameters
- Returns a typed Promise
- Throws a normalized `ApiError` on failure

The base client reads the Bearer token from `authStore` and attaches it to every request automatically.

---

## 9. Real-Time Strategy

For MVP (up to 500 concurrent voters), the frontend uses **polling** (HTTP interval requests):

- `useLiveResults` calls `GET /api/v1/polls/:room_code/results` every 3 seconds
- Stops polling when poll status is `closed`
- Displays a subtle "live" indicator while actively polling
- Shows last updated timestamp

For scale beyond 500 voters, the polling interval can be increased server-side or the client can be upgraded to SSE without changing the component interface — only `useLiveResults` needs to change.
