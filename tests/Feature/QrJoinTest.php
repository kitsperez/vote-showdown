<?php

use App\Models\Poll;
use App\Models\User;

it('redirects a guest from the join route to login', function () {
    $poll = Poll::factory()->active()->create();

    $this->get(route('polls.join', $poll))
        ->assertRedirect(route('login'));
});

it('sends an authenticated visitor straight to the vote screen', function () {
    $poll = Poll::factory()->active()->create();
    $user = User::factory()->invitee()->create();

    $this->actingAs($user)
        ->get(route('polls.join', $poll))
        ->assertRedirect(route('polls.show', $poll));
});
