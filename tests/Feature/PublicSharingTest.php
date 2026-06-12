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

it('lets a guest vote by email and creates a claimable account', function () {
    $poll = activeGuestPoll();

    $this->post(route('public-poll.vote', $poll), [
        'email' => 'guest@example.com',
        'name' => 'Guest Gary',
        'poll_option_id' => $poll->options->first()->id,
    ])->assertRedirect();

    $user = User::where('email', 'guest@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->is_guest)->toBeTrue()
        ->and($poll->votes()->where('user_id', $user->id)->count())->toBe(1);
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
