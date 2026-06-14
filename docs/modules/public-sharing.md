# Module - Public Sharing & Guest Voting

> Vertical slice. Cross-refs: QR voting [`qr-voting.md`](qr-voting.md), auth [`../06-auth-and-roles.md`](../06-auth-and-roles.md), realtime [`../07-realtime.md`](../07-realtime.md).

## Responsibility

Provide public links for voting and viewing results without requiring a normal login first.

## Current State

Implemented:

- `GET /p/{poll}` public guest voting page.
- `POST /p/{poll}/vote` public guest vote endpoint.
- `GET /r/{poll}` public results/spectator page.
- Guest vote by email with optional name.
- Claimable `users.is_guest` invitee accounts.
- Vote dedupe through the same `VoteService` used by authenticated voting.
- `voted_poll_{id}` cookie as a returning-guest UI hint.
- Public Reverb channel events for live guest/results updates.
- QR/share component pointing users to voting/results surfaces.

## Backend Contract

- `PublicPollController@show`
- `PublicPollController@vote`
- `PublicPollController@results`
- `StoreGuestVoteRequest`
- `VoteService::cast`
- `PollPresenter::present`

## Frontend Contract

- `layouts/guest-layout.tsx`
- `pages/public-poll.tsx`
- `pages/public-results.tsx`
- `components/showdown/qr-share.tsx`
- `hooks/use-public-poll-channel.ts`

## Security and Abuse Notes

- Public vote endpoint is rate-limited.
- Guest vote still creates/uses a user row, so votes are not anonymous in persistence.
- Claiming/upgrading a guest account needs a final product decision.
- Magic-link flow is pending and should be reconciled with this guest model.

## Acceptance Criteria

- [x] Logged-out visitor can open `/p/{poll}`.
- [x] Guest can vote by entering email and optional name.
- [x] Guest account is created with `is_guest=true`.
- [x] Same email cannot double-vote a single-choice poll.
- [x] Guest vote uses persisted vote rows and normal dedupe service.
- [x] Public results page exists at `/r/{poll}`.
- [x] Public pages can receive live updates.
- [x] Public vote endpoint is rate-limited.
- [x] QR/share surfaces expose public vote/results links.
- [ ] Decide guest account claim/upgrade policy.
- [ ] Verify logged-out guest voting end to end against local MySQL.
- [ ] Verify public live updates in two-browser Reverb test.
