<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Poll;
use App\Services\PollService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ShowControlController extends Controller
{
    public function __construct(private readonly PollService $polls) {}

    public function close(Poll $poll): RedirectResponse
    {
        $this->authorize('close', $poll); // owning creator OR admin

        $this->polls->close($poll);

        return back()->with('success', '🚨 Showdown closed!');
    }

    public function addSeconds(Request $request, Poll $poll): RedirectResponse
    {
        $this->authorize('control', $poll);

        $seconds = (int) $request->validate([
            'seconds' => ['required', 'integer', 'in:30,60'],
        ])['seconds'];

        $this->polls->addSeconds($poll, $seconds);

        return back()->with('success', "⏲ Added +{$seconds}s to the countdown!");
    }

    public function restart(Poll $poll): RedirectResponse
    {
        $this->authorize('control', $poll);

        $this->polls->restart($poll);

        return back()->with('success', '✨ Round reset! New showdown started.');
    }
}
