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
        $totalVoters = $poll->votes()->distinct('voter_key')->count('voter_key');
        $recentWindow = $poll->votes()->where('created_at', '>=', now()->subSeconds(60))->count();

        // Visit statistics (D17): total accesses + unique visitors, and the visit→vote
        // conversion now backs a real engagement rate instead of the old proxy.
        $totalVisits = (int) $poll->visits_count;
        $uniqueVisitors = $poll->visits()
            ->selectRaw('COUNT(DISTINCT COALESCE(user_id, ip_hash)) AS aggregate')
            ->value('aggregate');
        $uniqueVisitors = (int) $uniqueVisitors;

        return [
            'totalVoters' => $totalVoters,
            'velocityPerMinute' => $recentWindow,
            'totalVisits' => $totalVisits,
            'uniqueVisitors' => $uniqueVisitors,
            // Engagement = unique voters / unique visitors (D17 resolves the open denominator).
            'engagementRate' => $uniqueVisitors > 0 ? (int) round(min(100, $totalVoters / $uniqueVisitors * 100)) : 0,
        ];
    }
}
