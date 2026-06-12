<?php

namespace App\Services;

use App\Enums\PollStatus;
use App\Events\PollStatusChanged;
use App\Models\Poll;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PollService
{
    /**
     * Create a draft poll with its options in a single transaction.
     *
     * @param  array{title:string, description:?string, allow_multiple:bool, duration_seconds:int, options:array<int, array{label:string, color_class:?string, badge_color_class:?string}>}  $data
     */
    public function create(User $creator, array $data): Poll
    {
        return DB::transaction(function () use ($creator, $data) {
            $poll = $creator->polls()->create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'allow_multiple' => $data['allow_multiple'] ?? false,
                'access_password' => ! empty($data['access_password']) ? Hash::make($data['access_password']) : null,
                'end_mode' => $data['end_mode'] ?? 'duration',
                'duration_seconds' => $data['duration_seconds'] ?? null,
                'deadline_at' => $data['deadline_at'] ?? null,
                'status' => PollStatus::Draft,
            ]);

            foreach (array_values($data['options']) as $i => $option) {
                $imagePath = null;
                if (isset($option['image']) && $option['image'] instanceof UploadedFile) {
                    $imagePath = $option['image']->store('poll-options', 'public');
                }

                $poll->options()->create([
                    'label' => $option['label'],
                    'color_class' => $option['color_class'] ?? 'bg-[#00e3fd]',
                    'badge_color_class' => $option['badge_color_class'] ?? 'bg-[#00e3fd] text-[#1b1b1b]',
                    'image_path' => $imagePath,
                    'icon' => $option['icon'] ?? null,
                    'position' => $i,
                ]);
            }

            return $poll->load('options');
        });
    }

    /**
     * Update a poll's setup. Poll meta is always editable; options can only be
     * restructured (added/removed) before any votes exist — once voting has started, only
     * label/icon/image of existing options change, to protect tally integrity.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Poll $poll, array $data): Poll
    {
        return DB::transaction(function () use ($poll, $data) {
            $endMode = $data['end_mode'] ?? 'duration';

            $poll->fill([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'allow_multiple' => $data['allow_multiple'] ?? false,
                'end_mode' => $endMode,
                'duration_seconds' => $endMode === 'duration' ? ($data['duration_seconds'] ?? null) : null,
                'deadline_at' => $endMode === 'deadline' ? ($data['deadline_at'] ?? null) : null,
            ]);

            $endConfigChanged = $poll->isDirty(['end_mode', 'duration_seconds', 'deadline_at']);

            if (! empty($data['access_password'])) {
                $poll->access_password = Hash::make($data['access_password']);
            }
            $poll->save();

            if ($endConfigChanged && $poll->status === PollStatus::Active) {
                $poll->forceFill(['ends_at' => $this->resolveEndsAt($poll)])->save();
                $this->broadcastStatus($poll->fresh());
            }

            $options = array_values($data['options']);

            if (! $poll->votes()->exists()) {
                // Fresh poll — safe to fully resync options.
                $poll->options()->delete();
                foreach ($options as $i => $option) {
                    $poll->options()->create([
                        'label' => $option['label'],
                        'color_class' => $option['color_class'] ?? 'bg-[#00e3fd]',
                        'badge_color_class' => $option['badge_color_class'] ?? 'bg-[#00e3fd] text-[#1b1b1b]',
                        'image_path' => isset($option['image']) && $option['image'] instanceof UploadedFile
                            ? $option['image']->store('poll-options', 'public') : null,
                        'icon' => $option['icon'] ?? null,
                        'position' => $i,
                    ]);
                }
            } else {
                // Votes exist — only edit existing options in place (no add/remove).
                foreach ($options as $option) {
                    if (empty($option['id'])) {
                        continue;
                    }
                    $existing = $poll->options()->whereKey($option['id'])->first();
                    if (! $existing) {
                        continue;
                    }
                    $existing->label = $option['label'];
                    $existing->icon = $option['icon'] ?? $existing->icon;
                    if (isset($option['image']) && $option['image'] instanceof UploadedFile) {
                        $existing->image_path = $option['image']->store('poll-options', 'public');
                    }
                    $existing->save();
                }
            }

            return $poll->load('options');
        });
    }

    /**
     * Launch a poll. Per decision D1, this ends only the SAME creator's other active
     * poll — not a global stage.
     */
    public function launch(Poll $poll): Poll
    {
        return DB::transaction(function () use ($poll) {
            Poll::query()
                ->where('creator_id', $poll->creator_id)
                ->where('id', '!=', $poll->id)
                ->where('status', PollStatus::Active)
                ->each(fn (Poll $other) => $this->close($other));

            $poll->forceFill([
                'status' => PollStatus::Active,
                'starts_at' => now(),
                'ends_at' => $this->resolveEndsAt($poll),
            ])->save();

            $this->broadcastStatus($poll->fresh());

            return $poll;
        });
    }

    public function close(Poll $poll): Poll
    {
        $poll->forceFill([
            'status' => PollStatus::Ended,
            'ends_at' => $poll->ends_at && $poll->ends_at->isPast() ? $poll->ends_at : now(),
        ])->save();

        $this->broadcastStatus($poll->fresh());

        return $poll;
    }

    /**
     * Promptly close a poll whose countdown/deadline has elapsed but is still marked
     * active (e.g. before the per-minute sweeper runs). Idempotent — safe to call on read.
     */
    public function settleIfExpired(Poll $poll): Poll
    {
        if ($poll->status === PollStatus::Active && $poll->hasExpired()) {
            $this->close($poll);
            $poll->refresh();
        }

        return $poll;
    }

    public function addSeconds(Poll $poll, int $seconds): Poll
    {
        $base = ($poll->ends_at && $poll->ends_at->isFuture()) ? $poll->ends_at : now();

        $poll->forceFill(['ends_at' => $base->copy()->addSeconds($seconds)])->save();

        $this->broadcastStatus($poll->fresh());

        return $poll;
    }

    /**
     * Wipe votes and start a fresh round.
     */
    public function restart(Poll $poll): Poll
    {
        return DB::transaction(function () use ($poll) {
            $poll->votes()->delete();

            $poll->forceFill([
                'status' => PollStatus::Active,
                'starts_at' => now(),
                'ends_at' => $this->resolveEndsAt($poll),
            ])->save();

            $this->broadcastStatus($poll->fresh());

            return $poll;
        });
    }

    /**
     * Resolve the authoritative end (D7): a fixed deadline, or now + countdown.
     */
    private function resolveEndsAt(Poll $poll): \Illuminate\Support\Carbon
    {
        if ($poll->end_mode === 'deadline' && $poll->deadline_at) {
            return $poll->deadline_at;
        }

        return now()->addSeconds($poll->duration_seconds ?? 120);
    }

    private function broadcastStatus(Poll $poll): void
    {
        try {
            PollStatusChanged::dispatch($poll);
        } catch (\Throwable) {
        }
    }
}
