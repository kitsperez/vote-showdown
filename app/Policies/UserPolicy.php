<?php

namespace App\Policies;

use App\Models\User;

/**
 * User Management is admin-only (D16). Every action is reserved for admins; the
 * controller adds self-lockout and last-admin safeguards on top of these checks.
 */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, User $model): bool
    {
        // Admins can delete others, never themselves (also guarded in the controller).
        return $user->isAdmin() && $user->id !== $model->id;
    }
}
