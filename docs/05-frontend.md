# 05 · Frontend (Inertia v2 + React 19 + TS)

> Part of the [Vote Showdown source of truth](README.md). Prototype components live in `src/` today — see [`../CLAUDE.md`](../CLAUDE.md).
>
> **Design rule:** every page/component's visual design is taken from its counterpart in `src/` (kept as a frozen, read-only design reference) and must stay **cartoony Neo-Brutalist**. Before building any screen, open the matching `src/` file and the per-screen map in [`design-reference.md`](design-reference.md).

## The mental shift from the prototype

Today `App.tsx` owns **all** state and routing via flags. Under Inertia:

- **The server is the router.** A controller picks the page component name and passes props. No more `currentRole`/`adminTab` switch tree in one giant file.
- **Server data arrives as page props**, typed. `useState` is reserved for *local UI* state (form fields, open menus), not domain data.
- **Mutations go through `router`/`useForm`**, which POST to Laravel and reload only the affected props. Live updates from *other* users arrive via Echo (see [`07-realtime.md`](07-realtime.md)).

So `App.tsx` dissolves: its handlers move to controllers/services, its render branches become separate Inertia pages, and its child components are reused almost verbatim as presentational pieces fed by props.

> **Dependency note (H1):** the `route()` calls below need **Ziggy** (`tightenco/ziggy`) installed and wired in Phase 0 — see [`04-backend.md`](04-backend.md). Without it, `route()` is undefined in the browser.

## Inertia entry `[infra]`

```tsx
// resources/js/app.tsx
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import './bootstrap';            // axios + Echo
import '../css/app.css';         // = old src/index.css (@theme block intact)

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
    return pages[`./pages/${name}.tsx`];
  },
  setup: ({ el, App, props }) => createRoot(el).render(<App {...props} />),
});
```

## Types — the contract `[prototype→kept in sync]`

`resources/js/types/models.ts` is the TS mirror of the PHP enums/models. Ported from `src/types.ts` with the read-model `count` made explicit:

```ts
export type UserRole = 'admin' | 'creator' | 'invitee';      // mirrors UserRole enum
export type PollStatus = 'draft' | 'active' | 'ended';        // mirrors PollStatus enum

export interface User { id: number; name: string; email: string; role: UserRole; avatarText: string; avatarBgColor: string; }
export interface PollOption { id: number; label: string; colorClass: string; badgeColorClass: string; position: number; count: number; } // count is server-derived
export interface Poll { id: number; title: string; description: string | null; allowMultiple: boolean; status: PollStatus; durationSeconds: number; endsAt: string | null; remainingSeconds: number; options: PollOption[]; }
export interface VoterEntry { id: number; name: string; email: string; avatarText: string; avatarBgColor: string; votedOptionLabel: string; votedAt: string; }

// Props Inertia shares on every page (HandleInertiaRequests)
export interface SharedProps { auth: { user: User | null }; flash: { success?: string; error?: string }; }
```

> Backend serializes camelCase props (configure the model `toArray`/Resource mapping) so these match. Keep enum unions identical to [`04-backend.md`](04-backend.md).

## Pages (= the prototype's render branches) `[new+prototype]`

| Inertia page | Replaces (prototype) | Props | Notes |
|---|---|---|---|
| `pages/Dashboard.tsx` | role-aware home | `auth`, role-specific summary | creators see overview; admins see Showrunner panel (delegates to the AdminDashboard component) |
| `pages/Polls/Index.tsx` | creator poll list | `polls: Poll[]` | list + statuses |
| `pages/Polls/Create.tsx` | `PollCreatorView` `[prototype]` | `defaults` | form via `useForm`; POST `polls.store` |
| `pages/Polls/Show.tsx` | `ResultsTally` + live tally `[prototype]` | `poll: Poll`, `voters: VoterEntry[]` | subscribes to poll channel; renders tally race + ticker |
| `pages/Vote.tsx` | `InviteeView` `[prototype]` | `poll: Poll`, `hasVoted: boolean` | the invitee voting screen; POST `polls.votes.store` |
| `pages/Admin/Voters.tsx` | voters table (inlined in `App.tsx`) | `voters: VoterEntry[]` | audit log; admin/creator |
| `pages/Settings.tsx` | settings tab (inlined in `App.tsx`) | — | timer defaults, reset actions |

## Layouts `[prototype]`

The prototype's chrome (sidebar nav + header for creator/admin; bare layout for invitee) becomes persistent Inertia layouts:

- `layouts/ShowrunnerLayout.tsx` — the `<aside>` sidebar + `<header>` from `App.tsx` (Dashboard / Live Polls / Voter List / Settings nav), wrapping creator & admin pages. Active-tab styling now derives from the current route, not `adminTab` state.
- `layouts/InviteeLayout.tsx` — minimal wrapper for `Vote.tsx`.

Assign via Inertia's persistent layout pattern (`Page.layout = (page) => <ShowrunnerLayout>{page}</ShowrunnerLayout>`) so the sidebar doesn't remount between visits.

## Components `[prototype — port as-is]`

Move under `resources/js/components/`, strip their data ownership, feed via props:

- `RoleSelector.tsx` → becomes a real account/role switch is unnecessary (role is on the user); repurpose as a nav/user menu or drop. The persona is now the logged-in user's `role`.
- `PollCreatorView.tsx` → used by `pages/Polls/Create.tsx`; replace `onLaunchPoll` callback with `useForm().post`.
- `InviteeView.tsx` → used by `pages/Vote.tsx`; `onCastVote` → form POST.
- `AdminDashboard.tsx` → used by `pages/Dashboard.tsx` (admin); metrics now come from props/Echo, not the simulator. See [`modules/dashboard-and-analytics.md`](modules/dashboard-and-analytics.md).
- `ResultsTally.tsx` → used by `pages/Polls/Show.tsx`; tallies from props, updated by `usePollChannel`.
- `components/Toast.tsx` `[new]` — renders `flash` shared prop, replacing every `alert()`.

## Hooks `[new]`

```ts
// hooks/usePollChannel.ts — subscribe to live updates for one poll
export function usePollChannel(pollId: number, onVote: (tally: PollOption[]) => void, onStatus: (p: Poll) => void): void;

// hooks/useCountdown.ts — render seconds remaining from server endsAt (display only; server is authoritative)
export function useCountdown(endsAt: string | null): number;
```

`useCountdown` replaces the prototype's authoritative `setInterval` timer in `App.tsx` — it ticks locally for smooth display but the real end is enforced server-side and announced via `PollStatusChanged`.

## What the prototype's `App.tsx` logic becomes

| Prototype handler/effect | New home |
|---|---|
| `handleCastVote` | `VoteController@store` → `VoteService::cast` |
| `handleLaunchPoll` | `PollController@store`/`update` → `PollService::launch` |
| `handleClosePoll` | `ShowControlController@close` → `PollService::close` |
| `handleRestartPoll` | `ShowControlController@restart` → `PollService::restart` |
| `handleAddSeconds` | `ShowControlController@addSeconds` → `PollService::addSeconds` |
| countdown `useEffect` | `useCountdown` (display) + `polls.ends_at` (truth) |
| simulator `useEffect` | **deleted** — real votes broadcast via `VoteCast` |
| `alert()` everywhere | `flash` shared prop + `Toast` |
