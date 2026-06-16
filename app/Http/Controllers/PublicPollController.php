<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGuestVoteRequest;
use App\Models\Poll;
use App\Services\PollService;
use App\Services\PollVisitService;
use App\Services\VoteService;
use App\Support\PollPresenter;
use App\Support\VoterIdentity;
use App\Support\VoterPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public, no-login guest poll page (D8). Shareable link + QR target. Guests view the
 * poll and vote by email; the first vote creates a claimable is_guest account.
 */
class PublicPollController extends Controller
{
    public function __construct(
        private readonly VoteService $votes,
        private readonly PollService $polls,
        private readonly PollVisitService $visits,
    ) {}

    public function show(Request $request, Poll $poll): Response
    {
        $this->polls->settleIfExpired($poll);
        $this->visits->record($poll, $request);

        return Inertia::render('public-poll', [
            'poll' => PollPresenter::present($poll),
            'voters' => $this->recentVoters($poll),
            // Tie the "voted" gate to the current round so a restart (new starts_at, votes
            // wiped) lets the same email/device vote again.
            'hasVoted' => $request->cookie("voted_poll_{$poll->uuid}") === $this->roundToken($poll),
        ]);
    }

    /**
     * Results-only spectator page (no voting). Shows a QR that links to the vote page.
     */
    public function results(Request $request, Poll $poll): Response
    {
        $this->polls->settleIfExpired($poll);
        $this->visits->record($poll, $request);

        return Inertia::render('public-results', [
            'poll' => PollPresenter::present($poll),
            'voters' => $this->recentVoters($poll),
        ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function recentVoters(Poll $poll)
    {
        return $poll->votes()
            ->with(['user', 'option'])
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($vote) => VoterPresenter::present($vote));
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

        // Per-device token (the email fallback). Persisted as a long-lived cookie so a
        // guest who omits their email still can't vote twice from the same device.
        $token = $request->cookie('voter_token') ?: Str::random(40);

        $voter = VoterIdentity::guest($request->input('email'), $request->input('name'), $token);
        $optionId = (int) $request->validated('poll_option_id');

        // Single-choice dedupe gives a friendly message before the service lock.
        if (! $poll->allow_multiple && $poll->votes()->where('voter_key', $voter->key)->exists()) {
            return back()->with('error', 'You already voted in this showdown.');
        }

        $this->votes->cast($voter, $poll, $optionId);

        return back()
            ->with('success', '⚡ Vote cast!')
            ->withCookie(cookie('voter_token', $token, 60 * 24 * 365))
            ->withCookie(cookie("voted_poll_{$poll->uuid}", $this->roundToken($poll), 60 * 24 * 30));
    }

    /**
     * Identifier for the poll's current voting round. Changes whenever the poll is launched
     * or restarted (votes wiped), so the per-device "voted" cookie resets with it.
     */
    private function roundToken(Poll $poll): string
    {
        return (string) ($poll->starts_at?->timestamp ?? 0);
    }
}
