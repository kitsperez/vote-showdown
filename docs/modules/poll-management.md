# Module · Poll Management

> Vertical slice. Part of the [source of truth](../README.md). Cross-refs: DB [`../03-database.md`](../03-database.md), backend [`../04-backend.md`](../04-backend.md), frontend [`../05-frontend.md`](../05-frontend.md).

## Responsibility

Everything about a poll's existence and lifecycle: a **creator** builds a poll (title, description, 2–10 options, single/multiple, and an **end mode**) and **launches** it; the poll moves `draft → active → ended`. Ports the prototype's `PollCreatorView` and the `handleLaunchPoll` logic.

> **End mode (countdown or deadline).** A poll ends either after a relative **countdown** (`duration_seconds`) or at an absolute **deadline date/time** (`deadline_at`) the creator picks. Both resolve into the single authoritative `ends_at` (see [`../03-database.md`](../03-database.md)), so the live timer, auto-end sweeper, and broadcasts work unchanged either way. The create form offers a toggle between "Countdown" and "Deadline date".
>
> **Optional access password (D9).** A creator may set a password that voters must enter once before voting; `polls.access_password` is stored **hashed**. If unset (null), the poll is open and anyone may vote anytime. Verification is via `POST /polls/{poll}/unlock` (or supplied alongside the first vote); on success a session flag / signed cookie `poll_unlocked_{id}` remembers it so the prompt isn't shown again. Applies on both the authed vote screen and the public guest page ([public-sharing.md](public-sharing.md)).
>
> **Option images / icons (D10).** Each option may carry an **uploaded image** (`image_path`, stored on the public disk) or a **named lucide icon** (`icon`). When present it renders on the option card in place of the number badge. Image upload uses Inertia's multipart `useForm` (`forceFormData`); validate as `image|max:2048`. `PollPresenter` exposes `imageUrl`/`icon` per option.
>
> **Edit / delete / close authority (D11).** Editing a poll's setup (`polls.edit` / `polls.update`) is allowed for the **owning creator or a super-admin** (`PollPolicy@update`). **Deleting** is **super-admin only** (`PollPolicy@delete`). **Closing early** is allowed for the owning creator or admin (`PollPolicy@close`, route `polls.control.close` outside the admin-only group); add-time/restart stay admin-only. Create & edit share one `PollForm` component. `PollService::update` only restructures options (add/remove) when the poll has **no votes yet**; once voting starts it edits existing options' label/icon/image in place to protect the tally.

> **Scope (decision D1, [`../08-delivery-plan.md`](../08-delivery-plan.md)): polls are per-creator.** Each creator may have **at most one active poll of their own**; launching does *not* affect other creators' polls. Admins can moderate/control any poll via `PollPolicy@control`, but there is no single global "stage."

## Lifecycle (state machine)

```
        create()                 launch()                 close()/expiry
draft ───────────▶ draft ─────────────────▶ active ───────────────────▶ ended
  ▲                                            │                            │
  └──────────────── restart() ◀────────────────┴────────────────────────────┘
   (restart wipes votes, re-activates with a fresh ends_at)
```

**Invariant: at most one `active` poll _per creator_.** `PollService::launch` ends only *this creator's* currently-active poll (`creator_id = poll.creator_id`) before activating the new one — scoped, not global (decision D1). The prototype's global de-activation was a single-user artifact and must not be ported verbatim.

## Data touched

- `polls` (+ `creator_id`, `status`, `duration_seconds`, `starts_at`, `ends_at`)
- `poll_options` (created with the poll, in a transaction)
- See full schema in [`../03-database.md`](../03-database.md).

## Backend

| Piece | File | Notes |
|---|---|---|
| Validation | `StorePollRequest` | options 2–10; duration in {45,90,120,180}; see [`../04-backend.md`](../04-backend.md) |
| Authz | `PollPolicy@create/update/launch/delete` | creator owns, or admin |
| Logic | `PollService::create/launch/close/restart` | transactional; `launch`/`close`/`restart` fire `PollStatusChanged` |
| HTTP | `PollController` (`index/create/store/show/update/destroy`) | Inertia responses |

`PollService::create` sketch:

```php
public function create(User $creator, array $data): Poll {
    return DB::transaction(function () use ($creator, $data) {
        $poll = $creator->polls()->create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'allow_multiple' => $data['allow_multiple'] ?? false,
            'duration_seconds' => $data['duration_seconds'],
            'status' => PollStatus::Draft,
        ]);
        foreach (array_values($data['options']) as $i => $opt) {
            $poll->options()->create([
                'label' => $opt['label'],
                'color_class' => $opt['color_class'] ?? null,
                'badge_color_class' => $opt['badge_color_class'] ?? null,
                'position' => $i,
            ]);
        }
        return $poll->load('options');
    });
}
```

## Frontend

- `pages/Polls/Create.tsx` — wraps the ported `PollCreatorView`. Local state for the option list (2–10, the prototype's add/remove logic stays); submit via `useForm().post(route('polls.store'))`. On success, redirect to `Polls/Show`.
- `pages/Polls/Index.tsx` — creator's polls with status badges and quick actions (launch/edit/delete).
- `pages/Polls/Show.tsx` — see [voting](voting.md) & [dashboard](dashboard-and-analytics.md) for the live view.

## Acceptance criteria

- [ ] Creator can create a draft with 2–10 options; <2 or >10 rejected server-side.
- [ ] Launching a **countdown** poll sets `ends_at = now + duration_seconds`; launching a **deadline** poll sets `ends_at = deadline_at`. Either way it ends only the **same creator's** other active poll (another creator's active poll is untouched).
- [ ] Deadline must be in the future (`after:now`); a deadline already in the past is rejected.
- [ ] Only the owning creator (or an admin) can edit/delete/launch a poll; others get 403.
- [ ] `PollStatusChanged` broadcasts on launch/close/restart (verified by a connected client flipping views).
- [ ] Option colors/badges round-trip (brutalist look preserved).
