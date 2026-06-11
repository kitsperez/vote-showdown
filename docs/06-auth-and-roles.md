# 06 · Authentication & Roles

> Part of the [Vote Showdown source of truth](README.md). Decision: **all three roles have real accounts** ([`01-overview.md`](01-overview.md)).

## Authentication `[infra]`

Use Laravel's official **Inertia + React starter kit** (Laravel 12 ships React/TS/Tailwind starters) — or Breeze (Inertia React) — for login, registration, password reset, and email verification. This gives us the auth pages, `auth` middleware, and the session guard out of the box; we layer roles on top.

- Sessions over cookies (default web guard). No token/SPA-API auth needed — Inertia rides the session.
- Registration captures `name`, `email`, `password`, and **role**. For a public app you'd default new sign-ups to `invitee` and elevate creators/admins manually (or via an invite); document the chosen policy in the register controller. Avatar fields (`avatar_text`, `avatar_bg_color`) are derived on registration (initials + a color from the brutalist palette in `src/data.ts`).

## Magic-link / one-tap voting (decision D2)

Requiring full register→verify→login before a live audience can vote would tank participation (the QR quick-vote flow is the product's core moment). So invitees keep accounts, but reach them frictionlessly:

- A poll's **QR / share link** points at a signed, expiring **magic link**. Following it logs the visitor into a lightweight `invitee` account (created on first use, keyed by email), then drops them straight on the `Vote` page — no password step.
- Returning voters with a session skip the link entirely.
- **Abuse controls (risk R5):** rate-limit link issuance and the voting endpoint; links are signed (`URL::temporarySignedRoute`) and short-lived; one vote per user per poll still holds via the `Cache::lock` in [`modules/voting.md`](modules/voting.md).
- **Open item:** whether the lightweight account is a full `users` row or a claimable "guest" that can later set a password — decide in Phase 1 ([`08-delivery-plan.md`](08-delivery-plan.md)).

The earlier "full accounts" decision stands; magic-link is the *delivery mechanism* for invitee accounts, not a reversal.

## The three roles

| Role | Account | Can do |
|------|---------|--------|
| **admin** (Showrunner) | yes | Everything a creator can, **plus** run-time show controls: close a poll early, add time, restart/reset, view full voter logs across polls. |
| **creator** | yes | Create, edit, launch, and delete **their own** polls; view results & their voters. |
| **invitee** (voter) | yes | Browse active polls and **cast one vote** per poll (or one per option if `allow_multiple`); see live results. Cannot create or control polls. |

Stored as `users.role` (enum, see [`03-database.md`](03-database.md)) and cast to `UserRole` (see [`04-backend.md`](04-backend.md)). There is no dynamic permission system — three fixed roles cover every requirement, so we deliberately avoid `spatie/laravel-permission` unless roles become data-driven later.

## Authorization

Enforced server-side with **Gates + Policies**; never trust the client. The prototype's `RoleSelector` dropdown is gone — capability is determined by the authenticated user's role.

- **Route middleware** for coarse gating, e.g. an `EnsureUserHasRole` middleware (`->middleware('role:admin')`) on the admin control routes, defined in `bootstrap/app.php` middleware aliases.
- **Policies** for per-resource decisions (`PollPolicy`, `VotePolicy` in [`04-backend.md`](04-backend.md)) — ownership and poll-state checks.
- **Frontend mirroring (UX only).** Pages hide controls the user can't use by reading `auth.user.role` from the shared props. This is convenience, not security; the server re-checks every mutation.

```php
// app/Http/Middleware/EnsureUserHasRole.php (sketch)
public function handle(Request $request, Closure $next, string ...$roles): Response {
    abort_unless($request->user() && in_array($request->user()->role->value, $roles), 403);
    return $next($request);
}
```

## Shared auth context to the frontend

`HandleInertiaRequests::share()` exposes the current user (and flash) to every page, matching `SharedProps` in [`05-frontend.md`](05-frontend.md):

```php
public function share(Request $request): array {
    return array_merge(parent::share($request), [
        'auth' => ['user' => $request->user()?->only('id','name','email','role','avatar_text','avatar_bg_color')],
        'flash' => ['success' => fn () => $request->session()->get('success'),
                    'error'   => fn () => $request->session()->get('error')],
    ]);
}
```

## Broadcast channel authorization

Live poll channels are **private** so only authenticated, eligible users receive vote streams. Channel auth lives in `routes/channels.php` and is detailed in [`07-realtime.md`](07-realtime.md) — at minimum, any authenticated user may listen to a poll they can see.
