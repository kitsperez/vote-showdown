<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\StoreGuestVoteRequest;
use App\Models\Poll;
use App\Models\User;
use App\Services\VoteService;
use App\Support\PollPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public, no-login guest poll page (D8). Shareable link + QR target. Guests view the
 * poll and vote by email; the first vote creates a claimable is_guest account.
 */
class PublicPollController extends Controller
{
    public function __construct(private readonly VoteService $votes) {}

    public function show(Request $request, Poll $poll): Response
    {
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

        return Inertia::render('public-poll', [
            'poll' => PollPresenter::present($poll),
            'voters' => $voters,
            'hasVoted' => (bool) $request->cookie("voted_poll_{$poll->id}"),
        ]);
    }

    /**
     * Results-only spectator page (no voting). Shows a QR that links to the vote page.
     */
    public function results(Poll $poll): Response
    {
        return Inertia::render('public-results', [
            'poll' => PollPresenter::present($poll),
        ]);
    }

    public function vote(StoreGuestVoteRequest $request, Poll $poll): RedirectResponse
    {
        if (! $poll->isActive()) {
            return back()->with('error', 'This showdown is not accepting votes right now.');
        }

        // Password gate (D9): open polls pass straight through.
        if (! $poll->isUnlocked()) {
            return back()->with('error', '🔒 This poll is password protected. Enter the password first.');
        }

        $user = $this->resolveGuest($request->string('email'), $request->input('name'));
        $optionId = (int) $request->validated('poll_option_id');

        // Single-choice dedupe gives a friendly message before the service lock.
        $already = $poll->votes()->where('user_id', $user->id);
        if (! $poll->allow_multiple && $already->exists()) {
            return back()->with('error', 'You already voted in this showdown.');
        }

        $this->votes->cast($user, $poll, $optionId);

        return back()
            ->with('success', '⚡ Vote cast!')
            ->withCookie(cookie("voted_poll_{$poll->id}", '1', 60 * 24 * 30));
    }

    /**
     * Find-or-create a claimable, email-keyed guest invitee (D8).
     */
    private function resolveGuest(string $email, ?string $name): User
    {
        $display = $name ?: Str::title(Str::before($email, '@'));
        $palette = ['bg-[#ffded6]', 'bg-[#ffd9e0]', 'bg-[#9cf0ff]', 'bg-[#ffe170]', 'bg-[#00e3fd]', 'bg-[#ffb1c3]'];

        return User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $display,
                'password' => Hash::make(Str::random(40)),
                'role' => UserRole::Invitee,
                'is_guest' => true,
                'avatar_text' => strtoupper(Str::substr($display, 0, 2)),
                'avatar_bg_color' => $palette[array_rand($palette)],
            ],
        );
    }
}
