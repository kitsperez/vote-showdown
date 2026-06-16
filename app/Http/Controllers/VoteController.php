<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVoteRequest;
use App\Models\Poll;
use App\Services\VoteService;
use App\Support\VoterIdentity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VoteController extends Controller
{
    public function __construct(private readonly VoteService $votes) {}

    public function store(StoreVoteRequest $request, Poll $poll): RedirectResponse
    {
        $optionId = (int) $request->validated('poll_option_id');

        $this->authorize('cast', [$poll, $optionId]);

        // Password gate (D9): open polls pass straight through.
        abort_unless($poll->isUnlocked(), 403, 'This poll is password protected.');

        $this->votes->cast(VoterIdentity::fromUser($request->user()), $poll, $optionId);

        return back()->with('success', '⚡ Vote cast!');
    }

    /**
     * Admin moderation (D18): delete a specific voter's votes on a poll, identified by
     * voter_key. Confirmed in the UI via a modal; tallies are derived and rebroadcast.
     */
    public function destroyForVoter(Request $request, Poll $poll): RedirectResponse
    {
        $this->authorize('deleteVotes', $poll);

        $voterKey = (string) $request->validate([
            'voter_key' => ['required', 'string', 'max:191'],
        ])['voter_key'];

        $removed = $this->votes->deleteForVoterKey($poll, $voterKey);

        return back()->with(
            'success',
            $removed > 0 ? '🗑️ Removed the voter’s vote.' : 'No votes to remove for that voter.',
        );
    }
}
