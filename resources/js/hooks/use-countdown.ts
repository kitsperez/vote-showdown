import { useEffect, useState } from 'react';

/**
 * Display-only countdown derived from the server's authoritative `endsAt`. The server
 * enforces the real end (votes past ends_at are rejected; a scheduler auto-closes), so
 * this just ticks for smooth UI.
 */
export function useCountdown(endsAt: string | null): number {
    const compute = () => {
        if (!endsAt) return 0;
        const diff = Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000);
        return diff > 0 ? diff : 0;
    };

    const [seconds, setSeconds] = useState<number>(compute);

    useEffect(() => {
        setSeconds(compute());
        const id = setInterval(() => setSeconds(compute()), 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endsAt]);

    return seconds;
}
