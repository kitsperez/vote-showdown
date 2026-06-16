<?php

namespace App\Support;

use App\Models\Vote;
use Illuminate\Support\Str;

/**
 * Serializes a vote into the voter-row shape the UI renders. Handles both authenticated
 * voters (joined user) and guests (identity stored on the vote, no user account).
 */
class VoterPresenter
{
    private const PALETTE = ['bg-[#ffded6]', 'bg-[#ffd9e0]', 'bg-[#9cf0ff]', 'bg-[#ffe170]', 'bg-[#00e3fd]', 'bg-[#ffb1c3]'];

    /**
     * @return array<string, mixed>
     */
    public static function present(Vote $vote): array
    {
        $name = $vote->user?->name
            ?? $vote->voter_name
            ?? ($vote->voter_email ? Str::title(Str::before($vote->voter_email, '@')) : 'Guest Voter');

        $avatarText = $vote->user?->avatar_text ?? strtoupper(Str::substr($name, 0, 2));
        $avatarColor = $vote->user?->avatar_bg_color
            ?? self::PALETTE[abs(crc32((string) $vote->voter_key)) % count(self::PALETTE)];

        return [
            'id' => $vote->id,
            'voterKey' => $vote->voter_key,
            'name' => $name,
            'avatarText' => $avatarText,
            'avatarBgColor' => $avatarColor,
            'votedOptionLabel' => $vote->option?->label,
            'votedAt' => $vote->created_at->diffForHumans(),
        ];
    }
}
