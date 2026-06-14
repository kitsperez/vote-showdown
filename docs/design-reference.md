# Design Reference (Source of Truth for Visuals)

> Part of the [Vote Showdown source of truth](README.md). **Design authority:** the prototype files in [`../src/`](../src).

## The rule

**All visual/UI design is derived from the prototype in [`../src/`](../src).** Those files are the canonical reference for look, feel, layout, color, type, spacing, motion, and copy tone. When designing or building any new screen or component:

1. **Look at `src/` first.** Find the closest existing screen/component and match its visual language before inventing anything.
2. **Keep `src/` as a frozen design reference.** Do **not** delete or gut `src/` during the Laravel/Inertia migration. Even after its logic is ported to `resources/js`, `src/` stays in the repo as the design source of truth. Treat it as read-only reference, not live app code.
3. **The aesthetic is cartoony.** Playful, high-energy, game-show / comic-book energy — see the tokens below. New work that looks flat, corporate, or generically "clean" is wrong for this product.
4. **When in doubt, copy the prototype's classes verbatim.** The brutalist borders, hard offset shadows, and bright hex palette are intentional and exact (see [`../CLAUDE.md`](../CLAUDE.md) → Conventions).

## The aesthetic: cartoony Neo-Brutalism

A loud, bouncy, sticker-book take on Neo-Brutalism. Defining traits, all present in `src/`:

- **Thick black outlines on everything** — `border-[3px] border-[#1b1b1b]` (2px for small chips/avatars).
- **Hard offset drop shadows** (no blur) — `shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`, scaling 2px→8px by emphasis. The "shadow grows on hover, collapses on press" interaction is the signature feel.
- **Bright, saturated flat fills** — hot pink, cyan, sunny yellow, teal (palette below).
- **Playful rotation & bounce** — elements tilted `-rotate-12` / `rotate-6`, `animate-bounce`, `animate-pulse`, confetti, floating sticker badges (`InviteeView`, `ResultsTally`).
- **Chunky rounded corners** — `rounded-xl` / `rounded-2xl` on cards & buttons, full-round pills for avatars/timers.
- **Bold italic uppercase display type** — `font-black uppercase italic tracking-tighter` for headlines.
- **Emoji & comic copy** — "CAST MY SHOWDOWN VOTE! ⚡", "Don't be a cheeky voter!", trophy/confetti. Keep the cheeky, hype tone.

## Design tokens (extracted from `src/`)

### Color palette

| Role | Hex | Tailwind in `src/` |
|------|-----|--------------------|
| Ink / outline / text | `#1b1b1b` | `text-[#1b1b1b]`, `border-[#1b1b1b]` |
| Hot pink (primary action) | `#e4006c` | `bg-[#e4006c]` |
| Cyan (secondary action) | `#00e3fd` | `bg-[#00e3fd]` |
| Sunny yellow (accent/winner) | `#ffe170` | `bg-[#ffe170]` |
| Teal (deep panels / footer nav) | `#006875` | `bg-[#006875]` |
| Soft pink / blue / peach (avatars, soft states) | `#ffd9e0` `#9cf0ff` `#ffded6` `#ffb1c3` | see `src/data.ts` `bgColors` |
| Page background | `#f3f3f3` / `#f9f9f9` | `bg-[#f3f3f3]` |

The avatar/background palette lives in `src/data.ts` (`bgColors`) — reuse it for any new avatar or chip.

### Typography (from `src/index.css` `@theme`)

- **Display / body:** `Quicksand` → `font-sans`. Headlines: `font-black` + `uppercase italic tracking-tighter/tight`.
- **Mono / labels / metrics:** `Space Mono` → `font-mono`. Used for tags, counts, timers, uppercase micro-labels (`text-[10px]–text-xs uppercase tracking-wider`).

### Shape & elevation

- Borders: `border-[3px]` (cards/buttons), `border-[2px]` (chips/avatars/inner bars).
- Radius: `rounded-xl` (buttons, list items), `rounded-2xl` (cards), `rounded-full` (avatars, the circular countdown), `rounded-lg`/`rounded-md` (bars, small icon tiles).
- Shadows (hard, no blur): `shadow-[2px_2px…]` small → `shadow-[4px_4px…]` default → `shadow-[6px_6px…]` cards → `shadow-[8px_8px…]` hero/winner. Colored shadow variants exist too (e.g. yellow shadow on the dark timer: `shadow-[6px_6px_0px_0px_rgba(233,196,0,1)]`).

### Motion & interaction

- **Button press physics:** `hover:translate-y-[-2px] hover:shadow-[8px_8px…]` then `active:translate-y-[4px] active:shadow-none`. Apply to all primary buttons.
- **Decoration:** `animate-bounce` (stickers, confetti), `animate-pulse` (live timer), `-rotate-*/rotate-*` tilts on badges & winner cards.
- **Bars/tally:** `transition-all duration-500/700 ease-out` width animations; striped fill via the 45° `linear-gradient` background (see `ResultsTally`). The project also has `motion` (Framer Motion) available — see [`05-frontend.md`](05-frontend.md).

## Per-screen reference map

When building the production page, open the matching prototype file for the exact design:

| Production page/layout (`resources/js`) | Design reference (`src/`) |
|---|---|
| `pages/polls/create.tsx` | `src/components/PollCreatorView.tsx` |
| `pages/polls/edit.tsx` | `src/components/PollCreatorView.tsx` |
| `pages/polls/show.tsx` | `src/components/ResultsTally.tsx` and `src/components/InviteeView.tsx` |
| `pages/dashboard.tsx` | `src/components/AdminDashboard.tsx` |
| `pages/public-poll.tsx` | `src/components/InviteeView.tsx` |
| `pages/public-results.tsx` | `src/components/ResultsTally.tsx` |
| `layouts/showdown-layout.tsx` | the `<aside>` sidebar + `<header>` in `src/App.tsx` |
| `layouts/guest-layout.tsx` | the minimal invitee/public view framing in `src/components/InviteeView.tsx` |
| nav / user menu | `src/components/RoleSelector.tsx` |

## What to avoid

- Flat/blurry Material-style shadows, thin 1px hairline borders, muted/pastel-only palettes, sober corporate type — none of these match the cartoony brutalism.
- Removing the playful copy/emoji for "professionalism." Keep the hype voice.
- Inventing new brand colors. Pull from the palette above / `src/data.ts`.
