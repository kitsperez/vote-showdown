<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seeds a single guaranteed Super Admin so the app is manageable from a fresh install.
     * Voters are no longer user accounts, and other roles are created via User Management.
     * Password is "password".
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'outsourcing@sytian-productions.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin123'),
                'role' => UserRole::Admin,
                'avatar_text' => 'SA',
                'avatar_bg_color' => 'bg-[#e4006c]',
                'email_verified_at' => now(),
                'is_demo' => false,
            ],
        );
    }
}
