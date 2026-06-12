<?php

use App\Http\Controllers\Admin\ShowControlController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PollController;
use App\Http\Controllers\PublicPollController;
use App\Http\Controllers\VoteController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Public scan-to-vote entry (QR target). Guests are sent through login then returned here.
Route::get('polls/{poll}/join', [PollController::class, 'join'])
    ->middleware('throttle:30,1')
    ->name('polls.join');

// Public, no-login guest poll page + guest voting (D8). QR + share link target this.
Route::get('p/{poll}', [PublicPollController::class, 'show'])->name('public-poll.show');
Route::post('p/{poll}/vote', [PublicPollController::class, 'vote'])
    ->middleware('throttle:20,1')
    ->name('public-poll.vote');

// Public results-only spectator page (projection). Shows a QR linking to the vote page.
Route::get('r/{poll}', [PublicPollController::class, 'results'])->name('public-poll.results');

// Password unlock (D9) — works for guests and authed users.
Route::post('polls/{poll}/unlock', [PollController::class, 'unlock'])
    ->middleware('throttle:20,1')
    ->name('polls.unlock');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Poll lifecycle (create/show/delete); create+store gated to creators/admins via policy.
    Route::get('polls', [PollController::class, 'index'])->name('polls.index');
    Route::get('polls/create', [PollController::class, 'create'])->name('polls.create');
    Route::post('polls', [PollController::class, 'store'])->middleware('throttle:6,1')->name('polls.store');
    Route::get('polls/{poll}', [PollController::class, 'show'])->name('polls.show');
    // Edit/update setup — owning creator or super-admin (PollPolicy@update).
    Route::get('polls/{poll}/edit', [PollController::class, 'edit'])->name('polls.edit');
    Route::match(['put', 'patch'], 'polls/{poll}', [PollController::class, 'update'])->name('polls.update');
    // Delete — super-admin only (PollPolicy@delete).
    Route::delete('polls/{poll}', [PollController::class, 'destroy'])->name('polls.destroy');

    // Voting — rate limited per user (risk R4).
    Route::post('polls/{poll}/votes', [VoteController::class, 'store'])
        ->middleware('throttle:votes')
        ->name('polls.votes.store');

    // Close — owning creator OR admin (PollPolicy@close), so NOT behind role:admin.
    Route::post('polls/{poll}/control/close', [ShowControlController::class, 'close'])->name('polls.control.close');

    // Restart — owning creator OR admin (PollPolicy@restart).
    Route::post('polls/{poll}/control/restart', [ShowControlController::class, 'restart'])->name('polls.control.restart');

    // Other run-time controls (add-time) stay admin-only.
    Route::middleware('role:admin')
        ->prefix('polls/{poll}/control')
        ->name('polls.control.')
        ->controller(ShowControlController::class)
        ->group(function () {
            Route::post('add-time', 'addSeconds')->name('add-time');
        });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
