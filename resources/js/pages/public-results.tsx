import { router } from '@inertiajs/react';
import { Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CountdownBadge } from '@/components/showdown/countdown-badge';
import { OptionBadge } from '@/components/showdown/option-badge';
import { QrShare } from '@/components/showdown/qr-share';
import { useCountdown } from '@/hooks/use-countdown';
import { usePublicPollChannel } from '@/hooks/use-public-poll-channel';
import GuestLayout from '@/layouts/guest-layout';
import type { Poll, PollStatus, TallyEntry, VoterEntry } from '@/types/models';

interface ResultsProps {
    poll: Poll;
    voters: VoterEntry[];
}

type Bump = { key: number; label: string };

/**
 * Read-only spectator/projection page (D8). Live via the poll's PUBLIC channel — every
 * vote pops a "+1" on its option and prepends the voter, no refresh needed.
 */
export default function PublicResults({ poll, voters: initialVoters }: ResultsProps) {
    const [tally, setTally] = useState<TallyEntry[]>(() => poll.options.map((o) => ({ poll_option_id: o.id, label: o.label, count: o.count })));
    const [voters, setVoters] = useState<VoterEntry[]>(initialVoters);
    const [status, setStatus] = useState<PollStatus>(poll.status);
    const [endsAt, setEndsAt] = useState<string | null>(poll.endsAt);
    const [bumps, setBumps] = useState<Bump[]>([]);

    // Sync from server props (initial + the polling backstop below). Voters are re-synced
    // too — otherwise the list (seeded once at mount, then only grown by the live ticker)
    // gets dropped on the reload that fires when the poll settles. Mirrors polls/show.
    useEffect(() => {
        setTally(poll.options.map((o) => ({ poll_option_id: o.id, label: o.label, count: o.count })));
        setStatus(poll.status);
        setEndsAt(poll.endsAt);
        setVoters(initialVoters);
    }, [poll, initialVoters]);

    const remaining = useCountdown(endsAt);
    const isActive = status === 'active' && remaining > 0;
    const total = useMemo(() => tally.reduce((s, t) => s + t.count, 0) || 1, [tally]);
    const winner = useMemo(() => {
        if (tally.length === 0) return null;
        const max = Math.max(...tally.map((t) => t.count));
        if (max <= 0) return null;
        const top = tally.filter((t) => t.count === max);
        return top.length === 1 ? top[0] : null;
    }, [tally]);
    const meta = (id: number) => poll.options.find((o) => o.id === id);
    const voteUrl = route('public-poll.show', poll.id);

    const addBump = (label: string | null) => {
        if (!label) return;
        const key = Date.now() + Math.random();
        setBumps((b) => [...b, { key, label }]);
        setTimeout(() => setBumps((b) => b.filter((x) => x.key !== key)), 1100);
    };

    // Live updates over the public channel.
    usePublicPollChannel(poll.id, {
        onTally: (incoming) => setTally(incoming),
        onTicker: (voter) => {
            setVoters((prev) => [{ id: Date.now(), ...voter }, ...prev].slice(0, 20));
            addBump(voter.votedOptionLabel);
        },
        onStatus: (payload) => {
            setStatus(payload.status);
            setEndsAt(payload.endsAt);
            router.reload({ only: ['poll', 'voters'] });
        },
    });

    // Polling backstop for counts AND the voters feed if Reverb is unreachable
    // (no +1 animation, just correctness — keeps the voter list in sync too).
    useEffect(() => {
        if (!isActive) return;
        const id = setInterval(() => router.reload({ only: ['poll', 'voters'] }), 6000);
        return () => clearInterval(id);
    }, [isActive]);

    // When the countdown hits zero, force a refresh so the server can settle the poll
    // to "ended" and the winner banner appears.
    useEffect(() => {
        if (status !== 'active' || remaining > 0) return;
        router.reload({ only: ['poll', 'voters'] });
        const id = setInterval(() => router.reload({ only: ['poll', 'voters'] }), 2500);
        return () => clearInterval(id);
    }, [status, remaining, poll.id]);

    return (
        <GuestLayout title={`${poll.title} — Results`}>
            <div className="relative flex flex-col gap-8">
                {isActive && (
                    <div className="flex justify-center">
                        <CountdownBadge seconds={remaining} />
                    </div>
                )}

                {status === 'ended' && (
                    <div className="text-center">
                        <h2 className="mb-4 -rotate-1 text-3xl font-black tracking-tighter text-[#e4006c] uppercase italic md:text-5xl">THE WINNER IS… 🏆</h2>
                        <div className="inline-block rotate-1 rounded-2xl border-[3px] border-[#1b1b1b] bg-[#ffe170] px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-3xl font-black uppercase md:text-5xl">{winner?.label ?? 'No winner'}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    <div className="flex flex-col gap-6 lg:col-span-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic md:text-4xl">{poll.title}</h1>
                            {poll.description && <p className="mt-2 font-medium text-zinc-600 italic">"{poll.description}"</p>}
                        </div>

                        <div className="rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-8">
                            <h2 className="mb-6 flex items-center gap-2 text-xl font-black uppercase">
                                <Trophy className="h-5 w-5 fill-[#ffe170] text-[#ffe170]" /> {status === 'ended' ? 'The Final Tally' : 'Live Tally'}
                            </h2>
                            <div className="flex flex-col gap-6">
                                {tally.map((t) => {
                                    const pct = Math.round((t.count / total) * 100);
                                    const m = meta(t.poll_option_id);
                                    return (
                                        <div key={t.poll_option_id}>
                                            <div className="mb-2 flex items-center justify-between font-mono text-xs font-bold uppercase">
                                                <span className="flex items-center gap-2">
                                                    {m && <OptionBadge option={m} size="sm" />}
                                                    {t.label}
                                                </span>
                                                <span className="relative">
                                                    {bumps
                                                        .filter((b) => b.label === t.label)
                                                        .map((b) => (
                                                            <span key={b.key} className="animate-vote-pop pointer-events-none absolute -top-3 right-0 font-black text-[#e4006c]">
                                                                +1
                                                            </span>
                                                        ))}
                                                    {pct}% ({t.count})
                                                </span>
                                            </div>
                                            <div className="h-9 w-full overflow-hidden rounded-lg border-[3px] border-[#1b1b1b] bg-zinc-100">
                                                <div className={`h-full border-r-[3px] border-[#1b1b1b] transition-all duration-700 ${m?.colorClass ?? 'bg-[#00e3fd]'}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 lg:col-span-4">
                        {isActive && <QrShare url={voteUrl} />}

                        <div className="flex flex-col rounded-2xl border-[3px] border-[#1b1b1b] bg-[#006875] p-5 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="mb-4 flex items-center gap-2 font-bold uppercase">
                                <Trophy className="h-5 w-5 fill-[#ffe170] text-[#ffe170]" /> The Voters
                            </h3>
                            <div className="custom-scrollbar flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
                                {voters.length === 0 && (
                                    <p className="rounded-xl border-[2px] border-[#1b1b1b] bg-zinc-800 p-4 text-center text-sm text-zinc-300">No votes yet — scan the QR to join!</p>
                                )}
                                {voters.map((v) => (
                                    <div key={v.id} className="flex items-center gap-3 rounded-xl border-[2px] border-[#1b1b1b] bg-white p-3 text-[#1b1b1b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[2px] border-[#1b1b1b] font-mono text-xs font-bold ${v.avatarBgColor}`}>{v.avatarText}</div>
                                        <div className="overflow-hidden">
                                            <p className="truncate text-sm font-extrabold leading-tight">{v.name}</p>
                                            <p className="font-mono text-[10px] text-zinc-500 uppercase">Voted: {v.votedOptionLabel}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
