# 04 · Backend (Laravel 12)

> Part of the [Vote Showdown source of truth](README.md). Schema: [`03-database.md`](03-database.md). Real-time events: [`07-realtime.md`](07-realtime.md).

Layering rule (repeated from [`02-architecture.md`](02-architecture.md)): **Controller → FormRequest (validate) → Policy (authorize) → Service (domain logic) → Inertia render / redirect.** Controllers never contain business rules or queries beyond trivial reads.

## Enums `[new]`

```php
// app/Enums/UserRole.php
enum UserRole: string {
    case Admin = 'admin';
    case Creator = 'creator';
    case Invitee = 'invitee';
}

// app/Enums/PollStatus.php
enum PollStatus: string {
    case Draft = 'draft';
    case Active = 'active';
    case Ended = 'ended';
}
```

These are the cross-boundary contract — mirror them as TS unions in `resources/js/types/models.ts` (see [`05-frontend.md`](05-frontend.md)).

## Models `[new]`

```php
// app/Models/Poll.php
class Poll extends Model
{
    protected $fillable = ['creator_id','title','description','allow_multiple','status','end_mode','duration_seconds','deadline_at','starts_at','ends_at'];
    protected $casts = [
        'allow_multiple' => 'boolean',
        'status' => PollStatus::class,
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function creator() { return $this->belongsTo(User::class, 'creator_id'); }
    public function options() { return $this->hasMany(PollOption::class)->orderBy('position'); }
    public function votes()   { return $this->hasMany(Vote::class); }

    // Read-model helpers
    public function isActive(): bool { return $this->status === PollStatus::Active && ! $this->hasExpired(); }
    public function hasExpired(): bool { return $this->ends_at !== null && $this->ends_at->isPast(); }
    // Carbon 3 (Laravel 12) note: diffInSeconds returns a float and its sign semantics changed.
    // Guard with isFuture() instead of relying on a signed diff — see risk R8.
    public function remainingSeconds(): int {
        return ($this->ends_at && $this->ends_at->isFuture())
            ? (int) round(now()->diffInSeconds($this->ends_at)) : 0;
    }
}
```

```php
// app/Models/PollOption.php — exposes derived count via withCount('votes')
class PollOption extends Model
{
    protected $fillable = ['poll_id','label','color_class','badge_color_class','position'];
    public function poll()  { return $this->belongsTo(Poll::class); }
    public function votes() { return $this->hasMany(Vote::class); }
}

// app/Models/Vote.php
class Vote extends Model
{
    protected $fillable = ['poll_id','poll_option_id','user_id'];
    public function poll()   { return $this->belongsTo(Poll::class); }
    public function option() { return $this->belongsTo(PollOption::class, 'poll_option_id'); }
    public function user()   { return $this->belongsTo(User::class); }
}

// app/Models/User.php — add to default
protected $casts = [/* … */ 'role' => UserRole::class];
public function polls() { return $this->hasMany(Poll::class, 'creator_id'); }
public function votes() { return $this->hasMany(Vote::class); }
public function isAdmin(): bool   { return $this->role === UserRole::Admin; }
public function isCreator(): bool { return $this->role === UserRole::Creator; }
```

## Form Requests `[new]`

```php
// app/Http/Requests/StorePollRequest.php
public function authorize(): bool { return $this->user()->can('create', Poll::class); }
public function rules(): array {
    return [
        'title' => ['required','string','max:160'],
        'description' => ['nullable','string','max:500'],
        'allow_multiple' => ['boolean'],
        // End mode: countdown OR absolute deadline date/time.
        'end_mode' => ['required','in:duration,deadline'],
        'duration_seconds' => ['required_if:end_mode,duration','nullable','integer','in:45,90,120,180'],
        'deadline_at' => ['required_if:end_mode,deadline','nullable','date','after:now'],
        'options' => ['required','array','min:2','max:10'],
        'options.*.label' => ['required','string','max:120'],
        'options.*.color_class' => ['nullable','string','max:60'],
        'options.*.badge_color_class' => ['nullable','string','max:120'],
    ];
}
```

```php
// app/Http/Requests/StoreVoteRequest.php
public function authorize(): bool { return true; } // real authz in VotePolicy via controller
public function rules(): array {
    return [
        'poll_option_id' => ['required','integer','exists:poll_options,id'],
    ];
}
```

## Policies `[new]`

| Policy | Ability | Rule |
|--------|---------|------|
| `PollPolicy` | `create` | role is `creator` or `admin` |
| `PollPolicy` | `update`/`launch`/`delete` | `admin`, or the `creator` who owns it |
| `PollPolicy` | `control` (close, add time, reset) | role is `admin` |
| `VotePolicy` | `cast` | poll `isActive()`; user hasn't already voted (single-choice); not voted for this same option (multiple-choice) |

```php
// app/Policies/VotePolicy.php (sketch)
public function cast(User $user, Poll $poll, int $optionId): Response {
    if (! $poll->isActive()) return Response::deny('This showdown is not accepting votes.');
    $already = $poll->votes()->where('user_id', $user->id);
    if (! $poll->allow_multiple && $already->exists())
        return Response::deny('You already voted in this showdown.');
    if ($poll->allow_multiple && $already->clone()->where('poll_option_id', $optionId)->exists())
        return Response::deny('You already picked that option.');
    return Response::allow();
}
```

## Services `[new]`

Domain logic lives here; controllers and events depend on these.

```php
// app/Services/PollService.php
class PollService {
    public function create(User $creator, array $data): Poll;            // poll + options in a transaction
    public function launch(Poll $poll): Poll;                            // status=Active, starts_at=now; resolves ends_at by end_mode (now+duration_seconds, OR the fixed deadline_at); ends the SAME creator's other active poll only (decision D1); fires PollStatusChanged
    public function close(Poll $poll): Poll;                             // status=Ended, ends_at=now; fires PollStatusChanged
    public function addSeconds(Poll $poll, int $seconds): Poll;          // ends_at += seconds; re-broadcast timer
    public function restart(Poll $poll): Poll;                           // delete votes, status=Active, new ends_at; fires PollStatusChanged
}

// app/Services/VoteService.php
class VoteService {
    public function cast(User $user, Poll $poll, int $optionId): Vote;   // insert (DB-unique guarded) in a transaction; load fresh tally; fire VoteCast
    public function tally(Poll $poll): array;                            // [['poll_option_id'=>1,'label'=>…,'count'=>142], …]
}
```

`VoteService::cast` wraps the insert in a transaction and catches the unique-constraint violation as the last line of defense behind `VotePolicy` (race conditions). It computes the fresh tally once and hands it to the `VoteCast` event so clients update from authoritative numbers.

## Controllers `[new]`

All return Inertia responses except where noted.

```php
// PollController
index()   → Inertia 'Polls/Index'   (creator's polls + statuses)
create()  → Inertia 'Polls/Create'  (the PollCreatorView form)
store()   → PollService::create + (optional) launch → redirect to show
show()    → Inertia 'Polls/Show'    (poll + options + tally + remainingSeconds)
update()/destroy()  // creator/admin lifecycle edits

// VoteController
store(Poll $poll, StoreVoteRequest $r)
  → $this->authorize('cast', [$poll, $r->poll_option_id]); VoteService::cast(...)
  → back()->with('success', 'Vote cast!')   // Inertia partial reload refreshes tally; Reverb pushes to others

// DashboardController
index() → Inertia 'Dashboard' (role-aware: creator overview vs admin Showrunner panel)

// Admin/ShowControlController  (admin-only via PollPolicy@control)
close(Poll $poll)        → PollService::close
addSeconds(Poll $poll)   → PollService::addSeconds (request: seconds in {30,60})
restart(Poll $poll)      → PollService::restart
```

## Routes `[new]`

```php
// routes/web.php
Route::middleware('auth')->group(function () {
    Route::get('/', DashboardController::class.'@index')->name('dashboard');

    Route::resource('polls', PollController::class);
    Route::post('polls/{poll}/votes', [VoteController::class, 'store'])
        ->middleware('throttle:votes')->name('polls.votes.store');

    Route::prefix('polls/{poll}/control')->name('polls.control.')
        ->controller(Admin\ShowControlController::class)->group(function () {
            Route::post('close', 'close')->name('close');
            Route::post('add-time', 'addSeconds')->name('add-time');
            Route::post('restart', 'restart')->name('restart');
        });
});
```

`throttle:votes` is a named rate limiter (define in `bootstrap/app.php` / a service provider, e.g. 10/min per user) to blunt vote spamming. **Rate-limit the other write surfaces too** (risk R4/M4): poll creation (`throttle:6,1`), control actions, and magic-link issuance (see [`06-auth-and-roles.md`](06-auth-and-roles.md)). Channel auth routes live in `routes/channels.php` — see [`07-realtime.md`](07-realtime.md).

### Frontend route names — Ziggy required (risk H1)

The frontend uses Laravel's `route()` helper (e.g. `route('polls.store')`, see [`05-frontend.md`](05-frontend.md)). That helper does **not** exist in JS without **Ziggy** (`tightenco/ziggy`). Phase 0 must install Ziggy and expose routes to Inertia (`@routes` / the `ziggy-js` import), or every frontend call must use a hard-coded URL instead. This is a hard dependency, not optional.

## Testing `[new]` (Pest)

Minimum coverage per the migration plan's hardening phase:

- **Feature:** create poll (creator allowed, invitee forbidden); launch ends other active polls; cast vote increments tally; double-vote rejected (single-choice); voting a closed poll rejected; admin-only controls forbidden to creators.
- **Unit:** `Poll::remainingSeconds`/`hasExpired` (incl. the Carbon 3 boundary, R8); `VoteService` single-choice dedupe under concurrency (the `Cache::lock` holds where the policy check alone would not — R2).
- **Contract drift (CI gate, M5):** a test asserting each PHP enum's cases exactly match the TS string-literal union in `resources/js/types/models.ts`, so the cross-boundary contract can't silently rot.
