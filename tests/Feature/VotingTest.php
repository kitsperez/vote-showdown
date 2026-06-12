<?php

use App\Models\Poll;
use App\Models\PollOption;
use App\Models\User;
use App\Services\VoteService;
use Illuminate\Validation\ValidationException;

function activePollWithOptions(): Poll
{
    $poll = Poll::factory()->active()->create();
    $poll->options()->createMany([
        ['label' => 'Pineapple', 'position' => 0],
        ['label' => 'Pepperoni', 'position' => 1],
    ]);

    return $poll->load('options');
}

it('records a vote and increments the tally', function () {
    $poll = activePollWithOptions();
    $voter = User::factory()->invitee()->create();
    $option = $poll->options->first();

    $this->actingAs($voter)
        ->post(route('polls.votes.store', $poll), ['poll_option_id' => $option->id])
        ->assertRedirect();

    expect($poll->votes()->count())->toBe(1)
        ->and(app(VoteService::class)->tally($poll->fresh('options')))
        ->toContain(['poll_option_id' => $option->id, 'label' => 'Pineapple', 'count' => 1]);
});

it('rejects a second vote on a single-choice poll', function () {
    $poll = activePollWithOptions();
    $voter = User::factory()->invitee()->create();

    $this->actingAs($voter)->post(route('polls.votes.store', $poll), ['poll_option_id' => $poll->options[0]->id]);

    $this->actingAs($voter)
        ->post(route('polls.votes.store', $poll), ['poll_option_id' => $poll->options[1]->id])
        ->assertForbidden();

    expect($poll->votes()->count())->toBe(1);
});

it('the service lock blocks a single-choice double vote even past the policy (R2)', function () {
    $poll = activePollWithOptions();
    $voter = User::factory()->invitee()->create();
    $service = app(VoteService::class);

    $service->cast($voter, $poll, $poll->options[0]->id);

    expect(fn () => $service->cast($voter, $poll, $poll->options[1]->id))
        ->toThrow(ValidationException::class);

    expect($poll->votes()->where('user_id', $voter->id)->count())->toBe(1);
});

it('rejects voting on an ended poll', function () {
    $poll = Poll::factory()->ended()->create();
    $option = PollOption::factory()->for($poll)->create();
    $voter = User::factory()->invitee()->create();

    $this->actingAs($voter)
        ->post(route('polls.votes.store', $poll), ['poll_option_id' => $option->id])
        ->assertForbidden();
});

it('allows multiple distinct options but not the same one twice when allow_multiple', function () {
    $poll = activePollWithOptions();
    $poll->update(['allow_multiple' => true]);
    $voter = User::factory()->invitee()->create();
    $service = app(VoteService::class);

    $service->cast($voter, $poll, $poll->options[0]->id);
    $service->cast($voter, $poll, $poll->options[1]->id);
    expect($poll->votes()->where('user_id', $voter->id)->count())->toBe(2);

    expect(fn () => $service->cast($voter, $poll, $poll->options[0]->id))
        ->toThrow(ValidationException::class);
});
