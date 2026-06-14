# 04 - Backend (Laravel 12)

> Part of the [Vote Showdown source of truth](README.md).

## Layering Rule

Controllers stay thin:

```text
route -> middleware -> controller -> FormRequest -> Policy -> Service/query -> Inertia/redirect/broadcast
```

## Current Domain Files

- `app/Enums/UserRole.php`
- `app/Enums/PollStatus.php`
- `app/Models/User.php`
- `app/Models/Poll.php`
- `app/Models/PollOption.php`
- `app/Models/Vote.php`
- `app/Policies/PollPolicy.php`
- `app/Services/PollService.php`
- `app/Services/VoteService.php`
- `app/Support/PollPresenter.php`
- `app/Events/VoteCast.php`
- `app/Events/VoterTicked.php`
- `app/Events/PollStatusChanged.php`

There is no separate `VotePolicy.php` in the current codebase. Vote authorization is handled through `PollPolicy::cast` plus `VoteService` dedupe/state enforcement.

## Controllers

| Controller | Current responsibility |
|---|---|
| `DashboardController` | Role-aware dashboard props and metrics |
| `PollController` | Authenticated poll index/create/store/show/edit/update/delete, unlock, QR join |
| `VoteController` | Authenticated voting |
| `PublicPollController` | Public guest voting and public results |
| `Admin\ShowControlController` | Close, add time, restart |
| Auth controllers | Starter auth flows |
| Settings controllers | Starter profile/password settings |

## Requests

- `StorePollRequest`
- `UpdatePollRequest`
- `StoreVoteRequest`
- `StoreGuestVoteRequest`
- Starter auth/settings requests

## Policies

Current `PollPolicy` baseline:

- `create`: any authenticated user.
- `view`: any authenticated user.
- `update` / `launch`: owning creator or admin.
- `delete`: admin only.
- `close`: owning creator or admin.
- `restart`: owning creator or admin.
- `control`: admin only, used for add-time.
- `cast`: poll must be active and dedupe pre-checks must pass.

The service layer is still the final protection for vote dedupe races.

## Services

`PollService`:

- `create`
- `update`
- `launch`
- `close`
- `settleIfExpired`
- `addSeconds`
- `restart`

`VoteService`:

- `cast`
- `tally`
- broadcast tally/ticker with coalescing

## Routes

Public:

- `GET /`
- `GET /polls/{poll}/join`
- `GET /p/{poll}`
- `POST /p/{poll}/vote`
- `GET /r/{poll}`
- `POST /polls/{poll}/unlock`

Authenticated:

- `GET /dashboard`
- `GET /polls`
- `GET /polls/create`
- `POST /polls`
- `GET /polls/{poll}`
- `GET /polls/{poll}/edit`
- `PUT/PATCH /polls/{poll}`
- `DELETE /polls/{poll}`
- `POST /polls/{poll}/votes`
- `POST /polls/{poll}/control/close`
- `POST /polls/{poll}/control/restart`
- `POST /polls/{poll}/control/add-time`

Auth/settings routes live in `routes/auth.php` and `routes/settings.php`.

## Scheduling

`routes/console.php` schedules expired active polls to close every minute through `PollService::close`, which broadcasts `PollStatusChanged`.

## Backend Acceptance Checklist

- [x] FormRequests validate poll, vote, and guest vote payloads.
- [x] Policies enforce poll ownership/admin capabilities.
- [x] Vote dedupe is guarded by service lock and DB uniqueness for same option.
- [x] PollPresenter serializes frontend model shape.
- [x] Broadcast events provide typed payloads mirrored in TS.
- [x] Public guest vote path creates/reuses claimable guest users.
- [x] Password gate is enforced before vote casting.
- [ ] Add/confirm enum-contract drift test.
- [ ] Re-run full Pest suite and record current passing count before next coding phase.
