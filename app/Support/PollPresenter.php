<?php

namespace App\Support;

use App\Models\Poll;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

/**
 * Serializes Poll models into the camelCase prop shape consumed by the Inertia/React
 * layer (mirrors resources/js/types/models.ts). Counts are derived (read model only).
 */
class PollPresenter
{
    /**
     * @return array<string, mixed>
     */
    public static function present(Poll $poll, ?User $user = null): array
    {
        $poll->loadMissing('options');
        $poll->loadCount('votes');

        // votes_count per option, via a single eager count.
        $poll->options->loadCount('votes');

        $hasVoted = $user
            ? $poll->votes()->where('user_id', $user->id)->exists()
            : false;

        return [
            'id' => $poll->id,
            'title' => $poll->title,
            'description' => $poll->description,
            'allowMultiple' => $poll->allow_multiple,
            'status' => $poll->status->value,
            'requiresPassword' => $poll->requiresPassword(),
            'unlocked' => $poll->isUnlocked(),
            'endMode' => $poll->end_mode,
            'durationSeconds' => $poll->duration_seconds,
            'deadlineAt' => $poll->deadline_at?->toIso8601String(),
            'endsAt' => $poll->ends_at?->toIso8601String(),
            'remainingSeconds' => $poll->remainingSeconds(),
            'totalVotes' => $poll->votes_count,
            'hasVoted' => $hasVoted,
            'options' => $poll->options->map(fn ($option) => [
                'id' => $option->id,
                'label' => $option->label,
                'colorClass' => $option->color_class,
                'badgeColorClass' => $option->badge_color_class,
                'imageUrl' => $option->image_path ? Storage::url($option->image_path) : null,
                'icon' => $option->icon,
                'position' => $option->position,
                'count' => $option->votes_count,
            ])->values()->all(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function presentMany(iterable $polls): array
    {
        $out = [];
        foreach ($polls as $poll) {
            $out[] = self::present($poll);
        }

        return $out;
    }
}
