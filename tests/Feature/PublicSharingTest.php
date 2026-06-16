<?php

use App\Models\Poll;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

function activeGuestPoll(array $attrs = []): Poll
{
    $poll = Poll::factory()->active()->create($attrs);
    $poll->options()->createMany([
        ['label' => 'Pineapple', 'position' => 0],
        ['label' => 'Pepperoni', 'position' => 1],
    ]);

    return $poll->load('options');
}

it('shows the public guest poll page to a logged-out visitor', function () {
    $poll = activeGuestPoll();

    $this->get(route('public-poll.show', $poll))->assertOk();
});

it('shows the results-only page to a logged-out visitor', function () {
    $poll = activeGuestPoll();

    $this->get(route('public-poll.results', $poll))->assertOk();
});

it('lets a guest vote by email without creating a user account, keyed by email', function () {
    $poll = activeGuestPoll();

    $this->post(route('public-poll.vote', $poll), [
        'email' => 'guest@example.com',
        'name' => 'Guest Gary',
        'poll_option_id' => $poll->options->first()->id,
    ])->assertRedirect();

    // No user row is created for a guest voter anymore.
    expect(User::where('email', 'guest@example.com')->exists())->toBeFalse();

    // The vote carries the guest identity and is keyed by email for dedupe.
    $vote = $poll->votes()->first();
    expect($vote)->not->toBeNull()
        ->and($vote->user_id)->toBeNull()
        ->and($vote->voter_email)->toBe('guest@example.com')
        ->and($vote->voter_key)->toBe('email:guest@example.com');
});

it('lets the same email/device vote again after the poll is restarted', function () {
    $poll = activeGuestPoll();
    $option = $poll->options->first()->id;

    $this->post(route('public-poll.vote', $poll), ['email' => 'again@example.com', 'poll_option_id' => $option]);
    expect($poll->votes()->count())->toBe(1);

    // Restart wipes votes and starts a fresh round.
    app(App\Services\PollService::class)->restart($poll->fresh());
    expect($poll->fresh()->votes()->count())->toBe(0);

    // Same email can vote again in the new round.
    $this->post(route('public-poll.vote', $poll->fresh()), ['email' => 'again@example.com', 'poll_option_id' => $option])
        ->assertRedirect()->assertSessionHas('success');
    expect($poll->fresh()->votes()->where('voter_key', 'email:again@example.com')->count())->toBe(1);
});

it('dedupes a guest by email across attempts (no double vote)', function () {
    $poll = activeGuestPoll();
    $option = $poll->options->first()->id;

    $this->post(route('public-poll.vote', $poll), ['email' => 'dupe@example.com', 'poll_option_id' => $option]);
    $this->post(route('public-poll.vote', $poll), ['email' => 'dupe@example.com', 'poll_option_id' => $option])
        ->assertSessionHas('error');

    expect($poll->votes()->where('voter_key', 'email:dupe@example.com')->count())->toBe(1);
});

it('blocks guest voting on a password-protected poll until unlocked (D9)', function () {
    $poll = activeGuestPoll(['access_password' => Hash::make('secret')]);
    $option = $poll->options->first()->id;

    // Locked: vote is refused, nothing recorded.
    $this->post(route('public-poll.vote', $poll), ['email' => 'g@example.com', 'poll_option_id' => $option])
        ->assertSessionHas('error');
    expect($poll->votes()->count())->toBe(0);

    // Wrong password does not unlock.
    $this->post(route('polls.unlock', $poll), ['password' => 'nope'])->assertSessionHas('error');

    // Correct password unlocks the session, then the vote lands.
    $this->post(route('polls.unlock', $poll), ['password' => 'secret']);
    $this->post(route('public-poll.vote', $poll), ['email' => 'g@example.com', 'poll_option_id' => $option]);
    expect($poll->votes()->count())->toBe(1);
});
