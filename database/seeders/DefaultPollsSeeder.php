<?php

namespace Database\Seeders;

use App\Enums\PollStatus;
use App\Enums\UserRole;
use App\Models\Poll;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Ports `src/data.ts` defaultPolls. Counts are seeded as REAL vote rows (the tally is
 * derived, never a column). Demo voters are tagged is_demo so they can't masquerade as
 * real accounts and are purgeable in one query (risk M1). Local/staging only.
 */
class DefaultPollsSeeder extends Seeder
{
    public function run(): void
    {
        $creator = User::query()->where('email', 'creator@showdown.test')->first()
            ?? User::factory()->creator()->create(['email' => 'creator@showdown.test']);

        // Pool of demo voters reused across polls (one vote per user per poll).
        $pool = User::factory()->count(200)->invitee()->demo()->create();

        $polls = [
            [
                'title' => 'Best Pizza Topping?',
                'description' => 'Settle the debate once and for all... Sweet, savory, or salty?',
                'status' => PollStatus::Active,
                'duration' => 120,
                'options' => [
                    ['Pineapple', 'bg-[#ffe170]', 'bg-[#ffe170] text-[#1b1b1b]', 28],
                    ['Pepperoni', 'bg-[#e4006c]', 'bg-[#e4006c] text-[#ffffff]', 46],
                    ['Anchovies', 'bg-[#00e3fd]', 'bg-[#00e3fd] text-[#1b1b1b]', 11],
                ],
            ],
            [
                'title' => 'WHICH UTILITY BELT ACCESSORY IS MOST "BOSS"?',
                'description' => 'Settle the ultimate superhero debate. Choose wisely or regret it.',
                'status' => PollStatus::Active,
                'duration' => 120,
                'options' => [
                    ['LASER TOASTER', 'bg-[#e4006c]', 'bg-[#ffd9e0] text-[#3f0019]', 96],
                    ['POCKET CLOUD', 'bg-[#00e3fd]', 'bg-[#9cf0ff] text-[#001f24]', 54],
                ],
            ],
            [
                'title' => 'PIZZA TOPPED WITH TACOS',
                'description' => 'The final, ultimate vote of the century.',
                'status' => PollStatus::Ended,
                'duration' => 60,
                'options' => [
                    ['PIZZA TACOS', 'bg-[#e4006c]', 'bg-[#ffd9e0] text-[#3f0019]', 106],
                    ['SUSHI BURGER', 'bg-[#00e3fd]', 'bg-[#00e3fd] text-[#1b1b1b]', 37],
                    ['PASTA WAFFLES', 'bg-[#ffe170]', 'bg-[#ffe170] text-[#1b1b1b]', 12],
                ],
            ],
        ];

        foreach ($polls as $data) {
            $isActive = $data['status'] === PollStatus::Active;

            $poll = Poll::query()->create([
                'creator_id' => $creator->id,
                'title' => $data['title'],
                'description' => $data['description'],
                'allow_multiple' => false,
                'status' => $data['status'],
                'duration_seconds' => $data['duration'],
                'starts_at' => $isActive ? now() : now()->subHour(),
                'ends_at' => $isActive ? now()->addSeconds($data['duration']) : now()->subMinutes(58),
            ]);

            // Distinct voters per poll (single-choice). Shuffle the pool per poll.
            $voters = $pool->shuffle()->values();
            $cursor = 0;

            foreach ($data['options'] as $position => [$label, $color, $badge, $count]) {
                $option = $poll->options()->create([
                    'label' => $label,
                    'color_class' => $color,
                    'badge_color_class' => $badge,
                    'position' => $position,
                ]);

                $rows = [];
                for ($i = 0; $i < $count && $cursor < $voters->count(); $i++, $cursor++) {
                    $rows[] = [
                        'poll_id' => $poll->id,
                        'poll_option_id' => $option->id,
                        'user_id' => $voters[$cursor]->id,
                        'created_at' => Carbon::now()->subSeconds(random_int(1, 600)),
                        'updated_at' => now(),
                    ];
                }

                if ($rows !== []) {
                    Vote::query()->insert($rows);
                }
            }
        }
    }
}
