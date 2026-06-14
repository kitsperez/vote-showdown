# Module - Admin Controls (Showrunner)

> Vertical slice. Cross-refs: auth [`../06-auth-and-roles.md`](../06-auth-and-roles.md), backend [`../04-backend.md`](../04-backend.md), realtime [`../07-realtime.md`](../07-realtime.md).

## Responsibility

Runtime control of a live poll: close, add time, restart, and eventually audit voters/settings. Production actions mutate server state through controllers/services and broadcast status changes.

## Current Capability Matrix

| Action | Current authority | Effect |
|---|---|---|
| Close now | Owning creator or admin | `status=ended`, `ends_at=now`, broadcast `PollStatusChanged` |
| Add time | Admin only | Extend `ends_at` by 30 or 60 seconds, broadcast `PollStatusChanged` |
| Restart / new round | Owning creator or admin | Delete votes transactionally, reactivate poll, refresh `ends_at`, broadcast |
| Delete poll | Admin only | Delete poll and related records |
| Scheduled auto-end | System scheduler | Close expired active polls and broadcast |
| Voter audit page | Pending | Paginated vote log across relevant polls |
| Product settings page | Pending/decision needed | Decide whether to build or retire prototype settings concept |

## Backend

- `Admin\ShowControlController@close`
- `Admin\ShowControlController@addSeconds`
- `Admin\ShowControlController@restart`
- `PollService::close`
- `PollService::addSeconds`
- `PollService::restart`
- `routes/console.php` scheduled auto-end sweeper

`addSeconds` validates `seconds` in `{30, 60}`. `restart` deletes votes inside the service transaction before reactivating the poll.

## Authorization

Current policy baseline:

- `PollPolicy@close`: owning creator or admin.
- `PollPolicy@restart`: owning creator or admin.
- `PollPolicy@control`: admin only, currently used for add-time.
- `PollPolicy@delete`: admin only.

This is intentionally different from the older "all controls admin-only" plan. The current product state allows creators to close and restart their own polls while reserving cross-poll moderation and add-time for admins.

## Frontend

Controls are exposed on the authenticated poll show/manage surface according to permissions returned by the backend (`canControl`, `canRestart`, `canClose`, `canEdit`, `canDelete`). Success/error feedback uses flash/toast.

## Acceptance Criteria

- [x] Owner/admin can close a poll.
- [x] Owner/admin can restart a poll.
- [x] Admin can add time.
- [x] Admin-only delete is enforced.
- [x] Close, add-time, restart, and scheduled expiry broadcast `PollStatusChanged`.
- [x] Restart removes prior votes transactionally.
- [x] Scheduled sweeper auto-ends expired active polls.
- [~] Production feedback uses flash/toast; keep checking touched pages for leftover prototype `alert()` behavior.
- [ ] Dedicated voter audit page exists.
- [ ] Product settings/admin page decision is closed.
- [ ] Control action rate limits are reviewed and tightened where needed.
