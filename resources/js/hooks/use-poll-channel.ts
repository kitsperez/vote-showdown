import { echo } from '@laravel/echo-react';
import { useEffect, useRef } from 'react';
import type { PollStatusPayload, TallyEntry, VoterTickedPayload } from '@/types/models';

interface PollChannelHandlers {
    onTally?: (tally: TallyEntry[]) => void;
    onTicker?: (voter: VoterTickedPayload['voter']) => void;
    onStatus?: (payload: PollStatusPayload) => void;
}

/**
 * Subscribes to a poll's private channel and routes the three broadcast events:
 *  - .vote.cast    → authoritative tally snapshot (replace, don't increment — idempotent)
 *  - .voter.ticked → per-vote ticker blip
 *  - .poll.status  → status / countdown resync
 *
 * Handlers are held in a ref so changing them doesn't re-subscribe the socket.
 */
export function usePollChannel(pollId: number, handlers: PollChannelHandlers): void {
    const ref = useRef(handlers);
    ref.current = handlers;

    useEffect(() => {
        const channel = echo().private(`poll.${pollId}`);

        channel.listen('.vote.cast', (e: { tally: TallyEntry[] }) => ref.current.onTally?.(e.tally));
        channel.listen('.voter.ticked', (e: VoterTickedPayload) => ref.current.onTicker?.(e.voter));
        channel.listen('.poll.status', (e: PollStatusPayload) => ref.current.onStatus?.(e));

        return () => {
            echo().leave(`poll.${pollId}`);
        };
    }, [pollId]);
}
