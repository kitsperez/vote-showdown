# Module - Voting

> Vertical slice. Cross-refs: backend [`../04-backend.md`](../04-backend.md), realtime [`../07-realtime.md`](../07-realtime.md), public sharing [`public-sharing.md`](public-sharing.md).

## Responsibility

Persist votes, enforce dedupe/state rules, derive tallies, and broadcast live changes.

## Current Voting Paths

- Authenticated voting: `POST /polls/{poll}/votes`.
- Public guest voting: `POST /p/{poll}/vote`.
- Public guests are resolved or created as `users.is_guest = true`, `role=invitee`.
- Both paths reuse `VoteService::cast`.

## Rules

- Poll must be active.
- Password-protected poll must be unlocked before vote casting.
- Single-choice poll allows one vote per user per poll.
- Multiple-choice poll allows one vote per option per user.
- Tallies are derived from `votes`, not client state.
- `Cache::lock("vote:{poll}:{user}")` serializes per-user vote attempts.

## Realtime

After a vote:

- `VoterTicked` broadcasts a recent-voter entry.
- `VoteCast` broadcasts a coalesced tally snapshot.
- Authenticated pages listen through the private poll channel.
- Public pages listen through the public poll channel.

## Acceptance Criteria

- [x] Authenticated user can vote on an active poll.
- [x] Public guest can vote by email on an active public poll.
- [x] Guest vote creates or reuses a claimable guest invitee user.
- [x] Single-choice duplicate vote is rejected.
- [x] Multiple-choice duplicate same-option vote is rejected.
- [x] Draft/ended/expired polls reject votes.
- [x] Password-protected polls block voting until unlocked.
- [x] Tally increments from persisted vote rows.
- [x] Vote endpoint is rate-limited.
- [x] Broadcast failure does not break vote persistence.
- [ ] Verify acting voter does not see duplicate tally movement in live browser testing.
- [ ] Add/confirm feature coverage for password-protected public guest votes.
