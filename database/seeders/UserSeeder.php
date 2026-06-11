<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Dev login accounts — one per role. Password is "password" for all.
     */
    public function run(): void
    {
        $accounts = [
            ['Showrunner Admin', 'admin@showdown.test', UserRole::Admin, 'SA', 'bg-[#e4006c]'],
            ['Poll Creator', 'creator@showdown.test', UserRole::Creator, 'PC', 'bg-[#00e3fd]'],
            ['Vinny Voter', 'invitee@showdown.test', UserRole::Invitee, 'VV', 'bg-[#ffe170]'],
        ];

        foreach ($accounts as [$name, $email, $role, $avatar, $color]) {
            User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'role' => $role,
                    'avatar_text' => $avatar,
                    'avatar_bg_color' => $color,
                    'email_verified_at' => now(),
                    'is_demo' => false,
                ],
            );
        }
    }
}
