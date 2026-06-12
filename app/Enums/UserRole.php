<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Creator = 'creator';
    case Invitee = 'invitee';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Showrunner',
            self::Creator => 'Poll Creator',
            self::Invitee => 'Voter',
        };
    }
}
