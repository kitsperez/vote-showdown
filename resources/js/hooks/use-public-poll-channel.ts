import { echo } from '@laravel/echo-react';
import { useEffect, useRef } from 'react';
import type { PollStatusPayload, TallyEntry, VoterTickedPayload } from '@/types/models';

interface PollChannelHandlers {
    onTally?: (tally: TallyEntry[]) => void;
    onTicker?: (voter: VoterTickedPayload['voter']) => void;
    onStatus?: (payload: PollStatusPayload) => void;
}

/**
 * Subscribes to a poll's PUBLIC channel (no auth) for the guest / results pages. The
 * same events also fan out to the private channel for the authed page. Handlers held in
 * a ref so changing them doesn't re-subscribe.
 */
export function usePublicPollChannel(pollId: string, handlers: PollChannelHandlers): void {
    const ref = useRef(handlers);
    ref.current = handlers;

    useEffect(() => {
        const channel = echo().channel(`poll.${pollId}`);

        channel.listen('.vote.cast', (e: { tally: TallyEntry[] }) => ref.current.onTally?.(e.tally));
        channel.listen('.voter.ticked', (e: VoterTickedPayload) => ref.current.onTicker?.(e.voter));
        channel.listen('.poll.status', (e: PollStatusPayload) => ref.current.onStatus?.(e));

        return () => {
            echo().leave(`poll.${pollId}`);
        };
    }, [pollId]);
}
