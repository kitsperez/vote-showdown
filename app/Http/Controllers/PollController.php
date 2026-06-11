<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePollRequest;
use App\Models\Poll;
use App\Services\PollService;
use App\Support\PollPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PollController extends Controller
{
    public function __construct(private readonly PollService $polls) {}

    public function index(Request $request): Response
    {
        $polls = $request->user()->isAdmin()
            ? Poll::query()->latest()->with('options')->get()
            : $request->user()->polls()->latest()->with('options')->get();

        return Inertia::render('polls/index', [
            'polls' => PollPresenter::presentMany($polls),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Poll::class);

        return Inertia::render('polls/create');
    }

    public function store(StorePollRequest $request): RedirectResponse
    {
        $poll = $this->polls->create($request->user(), $request->validated());

        if ($request->boolean('launch')) {
            $this->polls->launch($poll);
        }

        return redirect()
            ->route('polls.show', $poll)
            ->with('success', '🚀 Poll created'.($request->boolean('launch') ? ' and launched!' : '!'));
    }

    public function show(Request $request, Poll $poll): Response
    {
        $this->authorize('view', $poll);

        $voters = $poll->votes()
            ->with(['user', 'option'])
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($vote) => [
                'id' => $vote->id,
                'name' => $vote->user->name,
                'avatarText' => $vote->user->avatar_text ?? strtoupper(substr($vote->user->name, 0, 2)),
                'avatarBgColor' => $vote->user->avatar_bg_color ?? 'bg-[#9cf0ff]',
                'votedOptionLabel' => $vote->option?->label,
                'votedAt' => $vote->created_at->diffForHumans(),
            ]);

        return Inertia::render('polls/show', [
            'poll' => PollPresenter::present($poll, $request->user()),
            'voters' => $voters,
            'canControl' => $request->user()->can('control', $poll),
        ]);
    }

    public function destroy(Poll $poll): RedirectResponse
    {
        $this->authorize('delete', $poll);

        $poll->delete();

        return redirect()->route('polls.index')->with('success', 'Poll deleted.');
    }

    /**
     * Clear a poll's password gate (D9) for the current session. Works for guests too.
     */
    public function unlock(Request $request, Poll $poll): RedirectResponse
    {
        $request->validate(['password' => ['required', 'string']]);

        if (! $poll->requiresPassword() || ! Hash::check($request->string('password'), $poll->access_password)) {
            return back()->with('error', '🔒 Wrong password.');
        }

        $request->session()->put("poll_unlocked_{$poll->id}", true);

        return back()->with('success', '🔓 Unlocked! You can vote now.');
    }

    /**
     * Scan-to-vote entry (public). Authenticated visitors land on the vote screen;
     * guests are funneled through login and returned here via the intended URL.
     */
    public function join(Request $request, Poll $poll): RedirectResponse
    {
        if ($request->user()) {
            return redirect()->route('polls.show', $poll);
        }

        return redirect()->guest(route('login'));
    }
}
