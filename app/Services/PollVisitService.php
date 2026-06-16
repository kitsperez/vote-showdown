<?php

namespace App\Services;

use App\Models\Poll;
use App\Models\PollVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Records poll page visits for backend/admin statistics (D17). Deduped one-per-session
 * per poll so refreshes don't inflate counts; IP is stored only as a salted hash (R13).
 * Recording is best-effort — it must never break the page render.
 */
class PollVisitService
{
    public function record(Poll $poll, Request $request): void
    {
        try {
            $sessionKey = "visited_poll_{$poll->uuid}";

            if ($request->session()->get($sessionKey) === true) {
                return; // already counted this visitor's session for this poll
            }

            $request->session()->put($sessionKey, true);

            DB::transaction(function () use ($poll, $request) {
                PollVisit::create([
                    'poll_id' => $poll->id,
                    'user_id' => $request->user()?->id,
                    'ip_hash' => $this->hashIp($request->ip()),
                    'user_agent' => substr((string) $request->userAgent(), 0, 255),
                    'visited_at' => now(),
                ]);

                $poll->increment('visits_count');
            });
        } catch (\Throwable) {
            // Statistics are non-critical; swallow so the page still renders.
        }
    }

    /**
     * Salted hash of the visitor IP — never store the raw address (R13).
     */
    private function hashIp(?string $ip): ?string
    {
        if ($ip === null) {
            return null;
        }

        return hash_hmac('sha256', $ip, (string) config('app.key'));
    }
}
