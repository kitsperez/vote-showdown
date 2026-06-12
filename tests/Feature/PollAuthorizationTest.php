<?php

use App\Enums\PollStatus;
use App\Models\Poll;
use App\Models\User;

function pollOwnedBy(User $creator, array $attrs = []): Poll
{
    $poll = Poll::factory()->for($creator, 'creator')->create($attrs);
    $poll->options()->createMany([['label' => 'A', 'position' => 0], ['label' => 'B', 'position' => 1]]);

    return $poll->load('options');
}

it('lets the owning creator update their poll', function () {
    $creator = User::factory()->creator()->create();
    $poll = pollOwnedBy($creator);

    $this->actingAs($creator)
        ->put(route('polls.update', $poll), [
            'title' => 'Renamed',
            'end_mode' => 'duration',
            'duration_seconds' => 90,
            'options' => [['id' => $poll->options[0]->id, 'label' => 'A2'], ['id' => $poll->options[1]->id, 'label' => 'B2']],
        ])
        ->assertRedirect(route('polls.show', $poll));

    expect($poll->fresh()->title)->toBe('Renamed');
});

it('lets a super-admin update any poll', function () {
    $admin = User::factory()->admin()->create();
    $poll = pollOwnedBy(User::factory()->creator()->create());

    $this->actingAs($admin)
        ->put(route('polls.update', $poll), [
            'title' => 'Admin edit',
            'end_mode' => 'duration',
            'duration_seconds' => 45,
            'options' => [['id' => $poll->options[0]->id, 'label' => 'A'], ['id' => $poll->options[1]->id, 'label' => 'B']],
        ])
        ->assertRedirect();

    expect($poll->fresh()->title)->toBe('Admin edit');
});

it('forbids a non-owner creator from updating', function () {
    $poll = pollOwnedBy(User::factory()->creator()->create());
    $other = User::factory()->creator()->create();

    $this->actingAs($other)
        ->put(route('polls.update', $poll), [
            'title' => 'Hijack',
            'end_mode' => 'duration',
            'duration_seconds' => 45,
            'options' => [['label' => 'x'], ['label' => 'y']],
        ])
        ->assertForbidden();
});

it('only a super-admin can delete a poll', function () {
    $creator = User::factory()->creator()->create();
    $poll = pollOwnedBy($creator);

    // Owning creator may NOT delete.
    $this->actingAs($creator)->delete(route('polls.destroy', $poll))->assertForbidden();
    expect(Poll::whereKey($poll->id)->exists())->toBeTrue();

    // Admin may delete.
    $this->actingAs(User::factory()->admin()->create())->delete(route('polls.destroy', $poll))->assertRedirect();
    expect(Poll::whereKey($poll->id)->exists())->toBeFalse();
});

it('lets the owning creator close their own poll', function () {
    $creator = User::factory()->creator()->create();
    $poll = pollOwnedBy($creator, ['status' => PollStatus::Active, 'ends_at' => now()->addMinutes(5)]);

    $this->actingAs($creator)->post(route('polls.control.close', $poll))->assertRedirect();

    expect($poll->fresh()->status)->toBe(PollStatus::Ended);
});

it('forbids a non-owner creator from closing someone else\'s poll', function () {
    $poll = pollOwnedBy(User::factory()->creator()->create(), ['status' => PollStatus::Active, 'ends_at' => now()->addMinutes(5)]);
    $other = User::factory()->creator()->create();

    $this->actingAs($other)->post(route('polls.control.close', $poll))->assertForbidden();
});
