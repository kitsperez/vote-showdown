# Module - Poll Management

> Vertical slice. Cross-refs: DB [`../03-database.md`](../03-database.md), backend [`../04-backend.md`](../04-backend.md), frontend [`../05-frontend.md`](../05-frontend.md).

## Responsibility

Poll creation and lifecycle: create, edit, launch, close, restart, delete, countdown/deadline endings, optional password gate, and option media.

## Current State

Implemented in production:

- Draft/active/ended lifecycle.
- One active poll per creator.
- Create/edit shared form.
- Countdown and deadline end modes.
- Optional `access_password` gate.
- Option `image_path` and `icon` fields.
- Owner/admin edit.
- Admin-only delete.
- Owner/admin close and restart.
- Admin-only add-time.
- Scheduled expiry through `routes/console.php`.

## Lifecycle

```text
create -> draft -> launch -> active -> close/expiry -> ended
                          -> restart wipes votes and reactivates
```

Launching a poll ends only the same creator's other active polls. It does not end polls owned by other creators.

## Backend Contract

- `StorePollRequest` validates create payloads.
- `UpdatePollRequest` validates edit payloads.
- `PollPolicy` owns create/update/launch/delete/close/restart/control permissions.
- `PollService` owns create/update/launch/close/addSeconds/restart/settleIfExpired.
- `PollPresenter` serializes camelCase read models for Inertia.

## Frontend Contract

- `resources/js/pages/polls/create.tsx`
- `resources/js/pages/polls/edit.tsx`
- `resources/js/pages/polls/index.tsx`
- `resources/js/pages/polls/show.tsx`
- `resources/js/components/showdown/poll-form.tsx`
- `resources/js/components/showdown/option-badge.tsx`

## Acceptance Criteria

- [x] Authenticated user can create a draft with 2-10 options.
- [x] Invalid option counts are rejected server-side.
- [x] Countdown poll launch sets `ends_at` from `duration_seconds`.
- [x] Deadline poll launch sets `ends_at` from `deadline_at`.
- [x] Past deadlines are rejected.
- [x] Launch ends only the same creator's other active poll.
- [x] Owner/admin can edit.
- [x] Admin only can delete.
- [x] Owner/admin can close and restart.
- [x] Add-time remains admin-only.
- [x] `PollStatusChanged` broadcasts on launch/close/restart/add-time.
- [x] Option colors/badges round-trip.
- [x] Optional password state is exposed to the frontend.
- [x] Option image/icon fields are represented in schema, requests, service, presenter, and TypeScript types.
- [ ] Verify uploaded images render end to end in local browser.
