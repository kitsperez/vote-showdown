<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poll_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('color_class')->default('bg-[#00e3fd]');
            $table->string('badge_color_class')->default('bg-[#00e3fd] text-[#1b1b1b]');
            $table->string('image_path')->nullable();   // uploaded image (D10)
            $table->string('icon')->nullable();         // OR a named lucide icon (D10)
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
            $table->index(['poll_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_options');
    }
};
