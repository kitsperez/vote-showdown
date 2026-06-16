<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

/**
 * Canonical identity for any voter — authenticated user or public guest. Voters are no
 * longer persisted as user accounts; a single `key` deduplicates votes and is keyed by,
 * in priority order: the user id, the guest email, or a per-device token (the fallback).
 */
final class VoterIdentity
{
    private const PALETTE = ['bg-[#ffded6]', 'bg-[#ffd9e0]', 'bg-[#9cf0ff]', 'bg-[#ffe170]', 'bg-[#00e3fd]', 'bg-[#ffb1c3]'];

    public function __construct(
        public readonly string $key,
        public readonly ?int $userId,
        public readonly ?string $email,
        public readonly ?string $name,
        public readonly ?string $token,
        public readonly string $displayName,
        public readonly string $avatarText,
        public readonly string $avatarBgColor,
    ) {}

    public static function fromUser(User $user): self
    {
        return new self(
            key: "user:{$user->id}",
            userId: $user->id,
            email: null,
            name: null,
            token: null,
            displayName: $user->name,
            avatarText: $user->avatar_text ?? strtoupper(substr($user->name, 0, 2)),
            avatarBgColor: $user->avatar_bg_color ?? 'bg-[#9cf0ff]',
        );
    }

    /**
     * Public guest identity. Dedupe prefers the email; when absent it falls back to the
     * per-device token so a tokened guest still can't vote twice.
     */
    public static function guest(?string $email, ?string $name, ?string $token): self
    {
        $email = $email ? strtolower(trim($email)) : null;

        if ($email !== null) {
            $key = "email:{$email}";
        } elseif ($token) {
            $key = "token:{$token}";
        } else {
            // No identifying signal at all — last-resort random key (won't dedupe, but is valid).
            $key = 'anon:'.Str::uuid();
        }

        $display = $name ?: ($email ? Str::title(Str::before($email, '@')) : 'Guest Voter');

        return new self(
            key: $key,
            userId: null,
            email: $email,
            name: $name ?: null,
            token: $token,
            displayName: $display,
            avatarText: strtoupper(Str::substr($display, 0, 2)),
            avatarBgColor: self::PALETTE[abs(crc32($key)) % count(self::PALETTE)],
        );
    }
}
