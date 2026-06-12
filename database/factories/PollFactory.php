<?php

namespace Database\Factories;

use App\Enums\PollStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Poll>
 */
class PollFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'creator_id' => User::factory()->creator(),
            'title' => rtrim(fake()->sentence(4), '.').'?',
            'description' => fake()->sentence(),
            'allow_multiple' => false,
            'status' => PollStatus::Draft,
            'duration_seconds' => fake()->randomElement([45, 90, 120, 180]),
            'starts_at' => null,
            'ends_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => PollStatus::Active,
            'starts_at' => now(),
            'ends_at' => now()->addSeconds(120),
        ]);
    }

    public function ended(): static
    {
        return $this->state(fn () => [
            'status' => PollStatus::Ended,
            'starts_at' => now()->subHour(),
            'ends_at' => now()->subMinutes(58),
        ]);
    }
}
