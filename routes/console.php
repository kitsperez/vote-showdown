<?php

use App\Enums\PollStatus;
use App\Models\Poll;
use App\Services\PollService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Server-authoritative auto-end: close polls whose countdown has elapsed even if no
 * further votes arrive, then broadcast so connected screens flip to results (risk R8).
 */
Schedule::call(function (PollService $polls) {
    Poll::query()
        ->where('status', PollStatus::Active)
        ->whereNotNull('ends_at')
        ->where('ends_at', '<=', now())
        ->each(fn (Poll $poll) => $polls->close($poll));
})->everyMinute()->name('auto-end-expired-polls')->withoutOverlapping();
