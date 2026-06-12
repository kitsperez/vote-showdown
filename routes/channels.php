<?php

use App\Models\Poll;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Live poll channel. Private so only authenticated users receive vote streams.
 * Public showdowns: any authenticated user may listen. Tighten here if polls
 * ever become private/invite-only (open decision).
 */
Broadcast::channel('poll.{poll}', function (User $user, Poll $poll) {
    return $user !== null;
});
