# Module - Admin Vote Moderation `[planned]`

> Vertical slice for D18. Cross-refs: voting [`voting.md`](voting.md), admin controls [`admin-controls.md`](admin-controls.md), realtime [`../07-realtime.md`](../07-realtime.md).

## Responsibility

Let an admin remove a specific voter's vote(s) on a poll (e.g. to clear an abusive or mistaken vote) from a confirmation modal, with tallies recomputing and rebroadcasting immediately.

## Database

No schema change. Operates on existing `votes` rows; tallies stay derived (never a stored count).

## Backend

- Route: `DELETE polls/{poll}/voters/{user}/votes` under `['auth','verified']`.
- `PollPolicy::deleteVotes(User $actor, Poll $poll)` — **admin only**.
- `VoteController::destroyForVoter(Poll $poll, User $voter)` — thin; authorizes then delegates.
- `VoteService::deleteForVoter(Poll $poll, User $voter)` — deletes that voter's vote rows on the poll inside a transaction, then rebroadcasts the tally and (if needed) status so live viewers update.

## Authorization

Admin-only (`PollPolicy::deleteVotes`). Distinct from creator-level controls — vote deletion is a moderation action reserved for Showrunners (consistent with D1: admins retain cross-poll moderation).

## Frontend

- The `polls/show` voter list gains an admin-only delete control per voter (gated by a `canModerateVotes` prop).
- Clicking it opens a **confirmation modal** ("Remove this voter's vote?"); confirming submits the delete.
- Success uses flash/toast; the tally updates live via the existing broadcast.

## Acceptance Criteria

- [ ] Non-admins receive 403 and never see the delete control.
- [ ] Admin can delete a specific voter's vote(s) on a poll.
- [ ] Derived tally reflects the removal immediately and rebroadcasts to live viewers.
- [ ] Deletion happens behind a confirmation modal (no accidental one-click delete).
- [ ] Feedback uses flash/toast; design follows the brutalist reference.
