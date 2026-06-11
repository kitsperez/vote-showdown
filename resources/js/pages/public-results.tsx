import { router } from '@inertiajs/react';
import { Clock, Trophy } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { QrShare } from '@/components/showdown/qr-share';
import { useCountdown } from '@/hooks/use-countdown';
import GuestLayout from '@/layouts/guest-layout';
import type { Poll } from '@/types/models';

/**
 * Read-only spectator/projection page (D8). No voting — just the live tally, plus a QR
 * the audience scans to reach the vote page.
 */
export default function PublicResults({ poll }: { poll: Poll }) {
    const remaining = useCountdown(poll.endsAt);
    const isActive = poll.status === 'active' && remaining > 0;
    const total = useMemo(() => poll.options.reduce((s, o) => s + o.count, 0) || 1, [poll.options]);
    const winner = useMemo(() => [...poll.options].sort((a, b) => b.count - a.count)[0], [poll.options]);
    const voteUrl = route('public-poll.show', poll.id);

    useEffect(() => {
        if (!isActive) return;
        const id = setInterval(() => router.reload({ only: ['poll'] }), 4000);
        return () => clearInterval(id);
    }, [isActive]);

    return (
        <GuestLayout title={`${poll.title} — Results`}>
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Tally */}
                <div className="lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic md:text-4xl">{poll.title}</h1>
                        {isActive ? (
                            <span className="flex shrink-0 items-center gap-1 font-mono text-sm font-bold text-[#006875] uppercase">
                                <Clock className="h-4 w-4" /> {remaining}s
                            </span>
                        ) : (
                            <span className="shrink-0 rounded border-[2px] border-[#1b1b1b] bg-zinc-200 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">Ended</span>
                        )}
                    </div>

                    {poll.status === 'ended' && (
                        <div className="mb-6 inline-block -rotate-1 rounded-2xl border-[3px] border-[#1b1b1b] bg-[#ffe170] px-6 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <span className="font-mono text-[10px] font-bold uppercase">🏆 Winner</span>
                            <p className="text-2xl font-black uppercase md:text-3xl">{winner?.label ?? '—'}</p>
                        </div>
                    )}

                    <div className="rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="mb-5 flex items-center gap-2 text-xl font-black uppercase">
                            <Trophy className="h-5 w-5 fill-[#ffe170] text-[#ffe170]" /> {poll.status === 'ended' ? 'Final Tally' : 'Live Tally'}
                        </h2>
                        <div className="flex flex-col gap-5">
                            {poll.options.map((opt) => {
                                const pct = Math.round((opt.count / total) * 100);
                                return (
                                    <div key={opt.id}>
                                        <div className="mb-1.5 flex justify-between font-mono text-xs font-bold uppercase">
                                            <span>{opt.label}</span>
                                            <span>{pct}% ({opt.count})</span>
                                        </div>
                                        <div className="h-9 w-full overflow-hidden rounded-lg border-[3px] border-[#1b1b1b] bg-zinc-100">
                                            <div className={`h-full border-r-[3px] border-[#1b1b1b] transition-all duration-700 ${opt.colorClass}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Side: scan-to-vote QR */}
                <aside className="lg:col-span-1">
                    <div className="lg:sticky lg:top-6">
                        <QrShare url={voteUrl} />
                    </div>
                </aside>
            </div>
        </GuestLayout>
    );
}
