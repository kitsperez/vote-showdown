<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('poll_options', function (Blueprint $table) {
            if (! Schema::hasColumn('poll_options', 'image_path')) {
                $table->string('image_path')->nullable()->after('badge_color_class');
            }

            if (! Schema::hasColumn('poll_options', 'icon')) {
                $table->string('icon')->nullable()->after('image_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('poll_options', function (Blueprint $table) {
            if (Schema::hasColumn('poll_options', 'icon')) {
                $table->dropColumn('icon');
            }

            if (Schema::hasColumn('poll_options', 'image_path')) {
                $table->dropColumn('image_path');
            }
        });
    }
};
