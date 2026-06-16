<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Creator = 'creator';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Creator => 'Poll Creator',
        };
    }
}
