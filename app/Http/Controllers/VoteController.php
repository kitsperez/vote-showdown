<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVoteRequest;
use App\Models\Poll;
use App\Services\VoteService;
use Illuminate\Http\RedirectResponse;

class VoteController extends Controller
{
    public function __construct(private readonly VoteService $votes) {}

    public function store(StoreVoteRequest $request, Poll $poll): RedirectResponse
    {
        $optionId = (int) $request->validated('poll_option_id');

        $this->authorize('cast', [$poll, $optionId]);

        // Password gate (D9): open polls pass straight through.
        abort_unless($poll->isUnlocked(), 403, 'This poll is password protected.');

        $this->votes->cast($request->user(), $poll, $optionId);

        return back()->with('success', '⚡ Vote cast!');
    }
}
