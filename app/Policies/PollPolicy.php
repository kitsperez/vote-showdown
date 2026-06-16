<?php

namespace App\Policies;

use App\Models\Poll;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PollPolicy
{
    /**
     * May this user cast a vote for the given option on this poll?
     *
     * Friendly pre-check only. The atomic lock in VoteService is the real enforcement
     * point for the dedupe race (risk R2) — this just yields a clean message.
     */
    public function cast(User $user, Poll $poll, int $optionId): Response
    {
        if (! $poll->isActive()) {
            return Response::deny('This showdown is not accepting votes right now.');
        }

        $already = $poll->votes()->where('user_id', $user->id);

        if (! $poll->allow_multiple && $already->exists()) {
            return Response::deny('You already voted in this showdown.');
        }

        if ($poll->allow_multiple && (clone $already)->where('poll_option_id', $optionId)->exists()) {
            return Response::deny('You already picked that option.');
        }

        return Response::allow();
    }

    /**
     * Any authenticated user may create a poll (they become its creator).
     */
    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, Poll $poll): bool
    {
        return true; // any authenticated user may view a poll they can reach
    }

    /**
     * The owning creator, or a super-admin, may edit a poll's setup — but only while it is
     * NOT live. Editing is allowed for a draft (pre-launch) and for an ended/expired poll;
     * a poll that is actively taking votes is locked to protect the round in progress.
     */
    public function update(User $user, Poll $poll): bool
    {
        return $this->ownsOrAdmin($user, $poll) && ! $poll->isActive();
    }

    /**
     * Launching is a role decision only (it runs on a draft); it is not blocked by the
     * "not while active" edit gate above.
     */
    public function launch(User $user, Poll $poll): bool
    {
        return $this->ownsOrAdmin($user, $poll);
    }

    private function ownsOrAdmin(User $user, Poll $poll): bool
    {
        return $user->isAdmin() || $poll->creator_id === $user->id;
    }

    /**
     * Deleting a poll is restricted to super-admins.
     */
    public function delete(User $user, Poll $poll): bool
    {
        return $user->isAdmin();
    }

    /**
     * The owning creator (or an admin) may close their own poll early.
     */
    public function close(User $user, Poll $poll): bool
    {
        return $user->isAdmin() || $poll->creator_id === $user->id;
    }

    /**
     * Wipe votes and start a fresh round (restart). Owning creator or admin.
     */
    public function restart(User $user, Poll $poll): bool
    {
        return $user->isAdmin() || $poll->creator_id === $user->id;
    }

    /**
     * Other run-time controls (e.g. add-time) stay admin-only (D1: admins retain cross-poll moderation).
     */
    public function control(User $user, Poll $poll): bool
    {
        return $user->isAdmin();
    }

    /**
     * Moderation: delete a specific voter's votes on a poll (D18). Admin-only.
     */
    public function deleteVotes(User $user, Poll $poll): bool
    {
        return $user->isAdmin();
    }
}
