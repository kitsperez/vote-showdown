# Module - QR Voting (Scan-to-Vote)

> Vertical slice. Cross-refs: public sharing [`public-sharing.md`](public-sharing.md), frontend [`../05-frontend.md`](../05-frontend.md).

## Responsibility

Let a live audience scan a QR code and land on a voting-capable surface with minimal friction.

## Current State

Implemented:

- `qrcode.react` dependency.
- `components/showdown/qr-share.tsx`.
- Public guest voting URL: `/p/{poll}`.
- Public results URL: `/r/{poll}`.
- QR/share components are shown on backend/public poll surfaces.
- Public results page includes a QR back to voting.
- Auth-intended join route: `/polls/{poll}/join`.

Important distinction:

- The implemented low-friction flow is public guest voting through `/p/{poll}`.
- `/polls/{poll}/join` currently redirects authenticated users to the poll show page and guests through login.
- Decide whether QR should continue using direct public `/p/{poll}` links everywhere or whether `/polls/{poll}/join` should become the canonical QR entry that decides public/auth/magic-link behavior.

## Planned Magic-Link Variant

Magic-link / one-tap invitee voting is not implemented. If built, it should reuse the same QR/share UI but change the resolved URL behavior to signed, temporary invitee access.

## Acceptance Criteria

- [x] QR component exists and renders a scannable URL.
- [x] Public guest vote QR path exists through `/p/{poll}`.
- [x] Results-only page can link/QR back to voting.
- [x] Public guest route does not require login.
- [x] Auth-intended join route is rate-limited.
- [ ] Decide canonical QR target: `/p/{poll}` or `/polls/{poll}/join`.
- [ ] Verify QR scan on mobile device in local/staging browser.
- [ ] Build magic-link variant only after the auth/guest account decision is closed.
