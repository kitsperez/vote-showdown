<?php

namespace App\Http\Controllers;

use App\Enums\PollStatus;
use App\Models\Poll;
use App\Support\PollPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Admins oversee any active poll; creators see their own.
        $activePollQuery = Poll::query()->where('status', PollStatus::Active)->latest('starts_at');

        if (! $user->isAdmin()) {
            $activePollQuery->where('creator_id', $user->id);
        }

        $activePoll = $activePollQuery->with('options')->first();

        $myPolls = $user->isAdmin()
            ? Poll::query()->latest()->with('options')->limit(10)->get()
            : $user->polls()->latest()->with('options')->limit(10)->get();

        return Inertia::render('dashboard', [
            'role' => $user->role->value,
            'activePoll' => $activePoll ? PollPresenter::present($activePoll, $user) : null,
            'polls' => PollPresenter::presentMany($myPolls),
            'metrics' => $activePoll ? $this->metrics($activePoll) : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function metrics(Poll $poll): array
    {
        $totalVoters = $poll->votes()->distinct('user_id')->count('user_id');
        $recentWindow = $poll->votes()->where('created_at', '>=', now()->subSeconds(60))->count();

        return [
            'totalVoters' => $totalVoters,
            'velocityPerMinute' => $recentWindow,
            // Engagement denominator is an open decision; trailing-window proxy for now.
            'engagementRate' => $totalVoters > 0 ? min(99, 60 + $recentWindow) : 0,
        ];
    }
}
