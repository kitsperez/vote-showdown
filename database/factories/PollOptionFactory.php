<?php

namespace Database\Factories;

use App\Models\Poll;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PollOption>
 */
class PollOptionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'poll_id' => Poll::factory(),
            'label' => ucfirst(fake()->word()),
            'color_class' => fake()->randomElement(['bg-[#e4006c]', 'bg-[#00e3fd]', 'bg-[#ffe170]']),
            'badge_color_class' => 'bg-[#ffe170] text-[#1b1b1b]',
            'position' => 0,
        ];
    }
}
