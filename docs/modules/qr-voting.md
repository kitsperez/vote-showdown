# Module · QR Voting (Scan-to-Vote)

> Vertical slice. Part of the [source of truth](../README.md). Ties together auth ([`../06-auth-and-roles.md`](../06-auth-and-roles.md)) and voting ([voting.md](voting.md)). Ports the prototype's QR button in `src/App.tsx` (which only `alert()`ed) into a real scan-to-vote flow.

## Responsibility

Let a live audience **scan a QR code and go straight to voting** on a poll — the signature "showdown" moment. The creator/admin displays the QR (on the poll page or a broadcast screen); each scanner lands on the poll's vote screen with the least friction the locked auth model allows.

## The flow

```
Creator/Admin screen                 Voter's phone
┌────────────────────┐   scans QR    ┌─────────────────────────────┐
│  [ ▓▓ QR ▓▓ ]      │ ────────────▶ │ GET /polls/{poll}/join      │
│  "Scan to vote!"   │               └──────────────┬──────────────┘
└────────────────────┘                              │
                                   authenticated? ───┤
                                       │ yes         │ no
                                       ▼             ▼
                              redirect to      redirect()->guest():
                              polls.show       store intended URL →
                              (vote screen)    login / quick register →
                                               back to polls.show
```

The QR encodes an **absolute URL to the public guest page** (`route('public-poll.show', poll)`, see [public-sharing.md](public-sharing.md)) — one printed/displayed code works for the whole audience, lands them on a no-login page, and lets them vote by email (D8). (Earlier this pointed at the login-gated `polls.join`, which still exists for authed deep-linking.)

## Two friction levels (decision)

1. **Default — public join + quick auth (build first).** QR → `/polls/{poll}/join`. Guests are sent through the existing login/register (one short step), then dropped on the vote screen via Laravel's intended-URL redirect. No new crypto, reuses everything in [`../06-auth-and-roles.md`](../06-auth-and-roles.md).
2. **Zero-login magic variant (later, D2).** For events that want literally one tap, the join route can instead mint a signed, short-lived link that creates/links a lightweight `invitee` account and skips the password step. Same QR placement; only the join handler changes. Gated on the magic-link account-model open decision.

> Both share the **same QR component and the same `polls.join` route** — friction level is a server-side handler choice, so the frontend doesn't change when we upgrade from (1) to (2).

## Backend `[new]`

- **Route:** `GET /polls/{poll}/join` → `PollController@join` (or a small `JoinController`), name `polls.join`. Public (no `auth` middleware) so guests can hit it; rate-limited.
- **Handler:**
  ```php
  public function join(Request $request, Poll $poll): RedirectResponse {
      if ($request->user()) {
          return redirect()->route('polls.show', $poll);
      }
      // Remember where to land, then send through auth.
      return redirect()->guest(route('login')); // intended = current join URL → back to show after login
  }
  ```
  (For variant 2, replace the guest branch with the signed-link/quick-account mint.)
- **Show route stays `auth`-gated**, so deep-linking `polls.show` directly still funnels guests through login — the QR just makes that path scannable.

## Frontend `[new]`

- **Dependency:** `qrcode.react` (client-side SVG QR; no backend image generation needed).
- **Component:** `components/showdown/qr-panel.tsx` — a brutalist card/modal showing `<QRCodeSVG value={joinUrl} />` plus the copyable link. `joinUrl = route('polls.join', poll.id)` (absolute; Ziggy `route(..., { absolute: true })` or `window.location.origin + ...`).
- **Placement:**
  - The **QR button in the poll/show header and dashboard** (ports the prototype's header QR button) opens the panel.
  - Optional **broadcast/"present" view** later: a full-screen QR + live tally for projecting on stage.
- Style: thick black border, hard offset shadow, "SCAN TO VOTE! ⚡" caption — cartoony per [`../design-reference.md`](../design-reference.md).

## Acceptance criteria

- [ ] A creator/admin can open a QR for any poll; it encodes the absolute `polls.join` URL.
- [ ] Scanning while logged out → login/register → lands on the poll's vote screen (intended-URL redirect works).
- [ ] Scanning while logged in → lands directly on the vote screen.
- [ ] The join route is public but rate-limited; `polls.show` remains auth-gated.
- [ ] One QR serves many voters; per-user dedupe still enforced at vote time (R2).
- [ ] (Variant 2, later) signed magic-link join skips the password step without changing the QR component.
