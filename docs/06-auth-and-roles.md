# 06 - Authentication & Roles

> Part of the [Vote Showdown source of truth](README.md).

## Authentication

The app uses Laravel's Inertia + React starter authentication stack:

- Session-based web guard.
- Login, registration, password reset, email verification, profile, and password settings pages.
- Shared Inertia auth/flash context through `HandleInertiaRequests`.
- Role data stored on `users.role` and cast through `App\Enums\UserRole`.

## Current Account Paths

Current implemented paths:

- **Authenticated users** can log in and access dashboard/poll pages.
- **Public guests** can open `/p/{poll}` and vote by email.
- A public guest vote resolves or creates a claimable `users.is_guest = true` invitee account keyed by email.
- Returning guest UI can use the `voted_poll_{id}` cookie as a convenience signal; server-side dedupe still comes from vote rows/service checks.

Planned path:

- **Magic-link / one-tap voting** remains pending. It should be reconciled with the implemented guest account model before coding. The likely target is a signed temporary route that creates or resolves an invitee/guest account, establishes session context if needed, and lands directly on the voting page.

## Roles

| Role | Account | Current capability |
|------|---------|--------------------|
| `admin` | yes | Oversee any poll, add time, delete polls, access admin-level controls, and moderate across creators |
| `creator` | yes | Create, edit, launch, close, and restart their own polls |
| `invitee` | yes | Vote, view results, and currently can also create polls because `PollPolicy@create` allows any authenticated user |
| guest account | claimable user row | Created through public vote by email with `role=invitee` and `is_guest=true` |

Open decision: whether all authenticated invitees should continue to create polls, or whether the product needs a stricter default-role/elevation policy.

## Authorization

Authorization is server-side:

- `EnsureUserHasRole` handles coarse route gating.
- `PollPolicy` handles resource decisions.
- `VoteService` and vote policy checks enforce vote state/dedupe rules.
- UI visibility is convenience only; every mutation must be protected server-side.

Current policy baseline:

- Create poll: any authenticated user.
- View poll: any authenticated user who reaches it.
- Update/launch: owning creator or admin.
- Delete: admin only.
- Close/restart: owning creator or admin.
- Add time/control: admin only.
- Cast vote: active poll and dedupe rules must pass.

## Public Guest Voting

Public guest voting lives in [`modules/public-sharing.md`](modules/public-sharing.md). It is not anonymous in the data model: the vote is attached to a user row created or found by email.

Abuse controls still needed:

- [ ] Verify public vote rate limits under realistic traffic.
- [ ] Decide whether claimable guest accounts require email verification before account upgrade.
- [ ] Decide if magic-link flow replaces, complements, or wraps public guest voting.

## Broadcast Channels

Private authenticated channel:

- `private-poll.{id}` equivalent in Laravel channel naming through `PrivateChannel("poll.{id}")`.

Public channel:

- `poll.{id}` supports public guest/results pages.

If private/invite-only polls become a product requirement, channel authorization and public routes must be tightened together.
