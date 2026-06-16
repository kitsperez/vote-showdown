<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Default seed is just the Super Admin so the app is manageable from a fresh install.
        // DefaultPollsSeeder (sample polls + demo voters) is opt-in: run it explicitly with
        //   php artisan db:seed --class=DefaultPollsSeeder
        $this->call([
            UserSeeder::class,
        ]);
    }
}
