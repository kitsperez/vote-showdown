import { Clock } from 'lucide-react';
import { formatCountdown } from '@/hooks/use-countdown';

/**
 * Designed countdown pill (dark card, yellow digits). `lg` for projection/results.
 */
export function CountdownBadge({ seconds, size = 'md' }: { seconds: number; size?: 'md' | 'lg' }) {
    return (
        <div className="inline-flex flex-col items-center rounded-2xl border-[3px] border-[#1b1b1b] bg-[#1b1b1b] px-5 py-2 text-[#ffe170] shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <span className="flex items-center gap-1 font-mono text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                <Clock className="h-3 w-3" /> Ends in
            </span>
            <span className={`font-mono font-black tabular-nums leading-none ${size === 'lg' ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl'}`}>
                {formatCountdown(seconds)}
            </span>
        </div>
    );
}
