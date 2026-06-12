<?php

namespace Database\Factories;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->name();

        return [
            'name' => $name,
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => UserRole::Invitee,
            'avatar_text' => strtoupper(Str::substr($name, 0, 2)),
            'avatar_bg_color' => fake()->randomElement([
                'bg-[#ffded6]', 'bg-[#ffd9e0]', 'bg-[#9cf0ff]', 'bg-[#ffe170]',
                'bg-[#00e3fd]', 'bg-[#ffb1c3]', 'bg-amber-100', 'bg-emerald-100',
            ]),
            'is_demo' => false,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => UserRole::Admin]);
    }

    public function creator(): static
    {
        return $this->state(fn () => ['role' => UserRole::Creator]);
    }

    public function invitee(): static
    {
        return $this->state(fn () => ['role' => UserRole::Invitee]);
    }

    public function demo(): static
    {
        return $this->state(fn () => ['is_demo' => true]);
    }
}
