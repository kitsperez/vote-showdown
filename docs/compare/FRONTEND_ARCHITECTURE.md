# Frontend Architecture
# Vote Showdown

> **Realigned to the source of truth.** Rewritten for the actual frontend: **Inertia v2 + React 19
> + TypeScript + Tailwind v4**. The earlier version described a standalone SPA (React Router v6,
> Zustand, shadcn/ui, Recharts, Axios) that we are **not** adopting (D5). Canonical: [`../05-frontend.md`](../05-frontend.md).

**Stack:** React 19, TypeScript, Inertia.js v2, Tailwind v4, Vite 6, Ziggy, Laravel Echo (Reverb).

---

## 1. Model

There is no separate frontend app and no client-side router or global store. Laravel routes pick a
page component and pass **typed props**; React owns local UI state only. Mutations go through
Inertia (`router`/`useForm`); live updates arrive over Echo/Reverb hooks. The frozen `src/`
prototype is design reference only and is **not** on the production import path (`@/*` → `resources/js`).

---

## 2. Folder Structure (`resources/js/`)

```
resources/js/
├── app.tsx                 # Inertia entry (createInertiaApp)
├── components/
│   ├── ui/                 # Radix-based starter primitives (Dialog, etc.) — NOT shadcn
│   └── showdown/
│       ├── poll-form.tsx        # shared create/edit form
│       ├── qr-share.tsx         # QR/share panel (qrcode.react)
│       ├── countdown-badge.tsx  # renders server endsAt
│       ├── option-badge.tsx     # option icon/image/badge
│       └── flash-toast.tsx      # flash/toast feedback (replaces alert())
├── hooks/
│   ├── use-countdown.ts            # local countdown over server-authoritative endsAt
│   ├── use-poll-channel.ts         # private/authed poll channel listener
│   ├── use-public-poll-channel.ts  # public poll channel listener
│   └── use-appearance.tsx          # forced light-only theme
├── layouts/
│   ├── showdown-layout.tsx   # primary authenticated shell
│   ├── guest-layout.tsx      # sidebar-less public voting/results shell
│   ├── app-layout.tsx + app/ # starter shell support
│   ├── auth/                 # restyled auth layouts
│   └── settings/layout.tsx   # settings shell
├── pages/
│   ├── welcome.tsx
│   ├── dashboard.tsx
│   ├── polls/{index,create,edit,show}.tsx
│   ├── public-poll.tsx       # public guest voting
│   ├── public-results.tsx    # public spectator/results
│   ├── auth/*                # starter auth flows, restyled
│   └── settings/*            # profile/password/appearance
├── types/models.ts           # TS read-model contract (mirror of PHP presenters/events)
└── lib/utils.ts
```

> No `api/`, `store/`, or `router/` directories — Inertia removes the need for an API client,
> Zustand, and React Router.

---

## 3. Pages

| Page | Inertia component | Responsibility |
|---|---|---|
| Landing | `welcome.tsx` | Public landing/auth entry (brutalist) |
| Dashboard | `dashboard.tsx` | Role-aware: active poll, recent polls, metrics |
| Poll list | `polls/index.tsx` | List + entry points |
| Create / Edit | `polls/create.tsx`, `polls/edit.tsx` | Shared `poll-form` |
| Poll show | `polls/show.tsx` | Authed show/results/voting/control surface |
| Public vote | `public-poll.tsx` | No-login guest voting |
| Public results | `public-results.tsx` | Spectator/projection + QR back to voting |
| Auth / Settings | `auth/*`, `settings/*` | Starter flows, restyled |

Planned: dedicated voter audit/log page; magic-link landing if D2 needs distinct UI.

---

## 4. Navigation, State & Data

- **Routing:** server-side via Laravel; client transitions through Inertia links/`router.visit`.
  `route()` (Ziggy) builds URLs in TS — always with the poll **UUID**.
- **State:** React `useState`/`useForm` for local UI only. Server data is the source of truth,
  delivered as props and refreshed by `router.reload({ only: [...] })` where needed.
- **Mutations:** `router.post/put/delete` or `useForm`; results come back as redirects + flash.
- **Auth/flash context:** shared Inertia props via `HandleInertiaRequests` (`auth`, `flash`).

---

## 5. Custom Hooks

- `useCountdown(endsAt)` — display countdown over server-authoritative `endsAt`.
- `usePollChannel(uuid, handlers)` — private/authed poll channel: `onTally`, `onTicker`, `onStatus`.
- `usePublicPollChannel(uuid, handlers)` — public channel for guest/results pages.
- `useAppearance()` — forced light-only theme.

---

## 6. Key Components

- **PollForm** — shared create/edit form (options 2–10, end mode, optional password, option media).
- **QrShare** — renders the poll's public vote/results URL as a QR (`qrcode.react`) with copy/share.
- **CountdownBadge** — server-`endsAt`-driven countdown.
- **OptionBadge** — renders an option's uploaded image, lucide icon, or color badge.
- **FlashToast** — surfaces server flash messages (production feedback; no `alert()`).
- Tally bars are **custom brutalist** components — no chart library (no Recharts).

---

## 7. TypeScript Contract (`types/models.ts`)

Mirror of `app/Enums/*`, `app/Support/PollPresenter.php`, and `*::broadcastWith()`. Current shapes:

```ts
type PollStatus = 'draft' | 'active' | 'ended';
type PollEndMode = 'duration' | 'deadline';

interface PollOption {
  id: number;
  label: string;
  colorClass: string;
  badgeColorClass: string;
  imageUrl: string | null;
  icon: string | null;
  position: number;
  count: number; // server-derived (read model)
}

interface Poll {
  id: string;            // the public UUID (D15)
  title: string;
  description: string | null;
  allowMultiple: boolean;
  status: PollStatus;
  requiresPassword: boolean;
  unlocked: boolean;
  endMode: PollEndMode;
  durationSeconds: number | null;
  deadlineAt: string | null;
  endsAt: string | null;
  remainingSeconds: number;
  totalVotes: number;
  hasVoted: boolean;
  options: PollOption[];
}

interface VoterEntry { id: number; voterKey?: string; name: string; avatarText: string; avatarBgColor: string; votedOptionLabel: string | null; votedAt?: string; }
```

Plus `PollMetrics` and the realtime payloads (`TallyEntry`, `VoterTickedPayload`, `PollStatusPayload`).
Keep this file in sync with the PHP presenters/events (drift is a bug — R7).

---

## 8. Real-Time Strategy

Live updates use **Reverb + Echo**, already implemented — not HTTP polling.

- `usePollChannel` / `usePublicPollChannel` subscribe to `poll.{uuid}` and handle `.vote.cast`
  (tally), `.voter.ticked` (ticker +1 animation), and `.poll.status` (status/endsAt).
- The public results page keeps a light `router.reload` backstop **only** for when Reverb is
  unreachable (R6) — correctness, not the primary transport.
- Persistence never depends on broadcasting succeeding.

See [`../07-realtime.md`](../07-realtime.md).
