<?php

use App\Enums\PollStatus;
use App\Models\Poll;
use App\Models\User;

it('lets a creator create and launch a poll', function () {
    $creator = User::factory()->creator()->create();

    $this->actingAs($creator)
        ->post(route('polls.store'), [
            'title' => 'Best Pizza Topping?',
            'description' => 'Sweet vs savory',
            'allow_multiple' => false,
            'end_mode' => 'duration',
            'duration_seconds' => 120,
            'launch' => true,
            'options' => [
                ['label' => 'Pineapple'],
                ['label' => 'Pepperoni'],
            ],
        ])
        ->assertRedirect();

    $poll = Poll::firstOrFail();
    expect($poll->status)->toBe(PollStatus::Active)
        ->and($poll->options)->toHaveCount(2)
        ->and($poll->ends_at)->not->toBeNull();
});

it('forbids an invitee from creating a poll', function () {
    $invitee = User::factory()->invitee()->create();

    $this->actingAs($invitee)
        ->post(route('polls.store'), [
            'title' => 'Nope',
            'duration_seconds' => 120,
            'options' => [['label' => 'a'], ['label' => 'b']],
        ])
        ->assertForbidden();
});

it('rejects fewer than two options', function () {
    $creator = User::factory()->creator()->create();

    $this->actingAs($creator)
        ->post(route('polls.store'), [
            'title' => 'One option only',
            'duration_seconds' => 120,
            'options' => [['label' => 'only']],
        ])
        ->assertSessionHasErrors('options');
});

it('creates a deadline poll whose ends_at equals the chosen deadline (D7)', function () {
    $creator = User::factory()->creator()->create();
    $deadline = now()->addDay()->startOfMinute();

    $this->actingAs($creator)
        ->post(route('polls.store'), [
            'title' => 'Vote by tomorrow',
            'end_mode' => 'deadline',
            'deadline_at' => $deadline->toDateTimeString(),
            'launch' => true,
            'options' => [['label' => 'Yes'], ['label' => 'No']],
        ])
        ->assertRedirect();

    $poll = Poll::firstOrFail();
    expect($poll->end_mode)->toBe('deadline')
        ->and($poll->status)->toBe(PollStatus::Active)
        ->and($poll->ends_at->equalTo($deadline))->toBeTrue();
});

it('rejects a deadline in the past', function () {
    $creator = User::factory()->creator()->create();

    $this->actingAs($creator)
        ->post(route('polls.store'), [
            'title' => 'Already over',
            'end_mode' => 'deadline',
            'deadline_at' => now()->subHour()->toDateTimeString(),
            'options' => [['label' => 'a'], ['label' => 'b']],
        ])
        ->assertSessionHasErrors('deadline_at');
});

it('launching ends only the same creator\'s other active poll (D1)', function () {
    $creator = User::factory()->creator()->create();
    $other = User::factory()->creator()->create();

    $mineOld = Poll::factory()->active()->for($creator, 'creator')->create();
    $theirs = Poll::factory()->active()->for($other, 'creator')->create();
    $mineNew = Poll::factory()->for($creator, 'creator')->create();
    $mineNew->options()->createMany([['label' => 'a', 'position' => 0], ['label' => 'b', 'position' => 1]]);

    app(\App\Services\PollService::class)->launch($mineNew);

    expect($mineOld->fresh()->status)->toBe(PollStatus::Ended)
        ->and($theirs->fresh()->status)->toBe(PollStatus::Active)   // untouched
        ->and($mineNew->fresh()->status)->toBe(PollStatus::Active);
});
