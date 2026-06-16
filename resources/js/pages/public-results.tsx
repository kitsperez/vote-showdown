import { router } from '@inertiajs/react';
import { Trophy, Users } from 'lucide-react';
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

// The voters panel shows a fixed window and auto-cycles through everyone so a projector
// surfaces all recent voters without anyone scrolling.
const VOTERS_PER_PAGE = 5;
const VOTERS_ROTATE_MS = 4500;

/**
 * Read-only spectator/projection page (D8). Built for big/wide screens. Live via the poll's
 * PUBLIC channel — every vote pops a "+1" on its option and prepends the voter, no refresh needed.
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
    const voteCount = useMemo(() => tally.reduce((s, t) => s + t.count, 0), [tally]);
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

    // Auto-rotating voter window: cross-fade through pages of 5 so everyone gets a turn.
    const [voterPage, setVoterPage] = useState(0);
    const [voterFade, setVoterFade] = useState(true);
    const pageCount = Math.max(1, Math.ceil(voters.length / VOTERS_PER_PAGE));

    // Keep the page index valid as the list grows/shrinks.
    useEffect(() => {
        setVoterPage((p) => (p >= pageCount ? 0 : p));
    }, [pageCount]);

    useEffect(() => {
        if (pageCount <= 1) return;
        const id = setInterval(() => {
            setVoterFade(false);
            window.setTimeout(() => {
                setVoterPage((p) => (p + 1) % pageCount);
                setVoterFade(true);
            }, 260);
        }, VOTERS_ROTATE_MS);
        return () => clearInterval(id);
    }, [pageCount]);

    const windowStart = voterPage * VOTERS_PER_PAGE;
    const visibleVoters = voters.slice(windowStart, windowStart + VOTERS_PER_PAGE);

    return (
        <GuestLayout title={`${poll.title} — Results`}>
            {/* Full-bleed: break out of the layout's max-w-5xl so the projection fills wide screens. */}
            <div className="relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen px-4 sm:px-6 lg:px-10 xl:px-16">
                <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-8 lg:gap-10">
                  

                    {status === 'ended' && (
                        
                        <div className="text-center">
                            <h2 className="mb-4 -rotate-1 text-3xl font-black tracking-tighter text-[#e4006c] uppercase italic md:text-5xl lg:text-6xl">
                                THE WINNER IS… 🏆
                            </h2>
                            <div className="inline-block rotate-1 rounded-2xl border-[3px] border-[#1b1b1b] bg-[#ffe170] px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] lg:px-12 lg:py-8">
                                <span className="text-3xl font-black uppercase md:text-5xl lg:text-6xl">{winner?.label ?? 'No winner'}</span>
                            </div>
                        </div>

                    )}

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
                        <div className="flex flex-col gap-6 lg:col-span-8 lg:gap-8">
                            <div className="flex gap-2 justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tighter uppercase italic md:text-4xl lg:text-5xl xl:text-6xl">{poll.title}</h1>
                                    {poll.description && <p className="mt-2 text-lg font-medium text-zinc-600 italic lg:text-xl">"{poll.description}"</p>}
                                </div>
                                {isActive && (
                                    <div className="flex justify-center">
                                        <CountdownBadge seconds={remaining} />
                                    </div>
                                )}
                            </div>
                            <div className="rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-8 lg:p-10">
                                <h2 className="mb-6 flex items-center gap-2 text-xl font-black uppercase lg:mb-8 lg:text-2xl">
                                    <Trophy className="h-5 w-5 fill-[#ffe170] text-[#ffe170] lg:h-7 lg:w-7" /> {status === 'ended' ? 'The Final Tally' : 'Live Tally'}
                                </h2>
                                <div className="flex flex-col gap-6 lg:gap-8">
                                    {tally.map((t) => {
                                        const pct = Math.round((t.count / total) * 100);
                                        const m = meta(t.poll_option_id);
                                        return (
                                            <div key={t.poll_option_id}>
                                                <div className="mb-2 flex items-center justify-between font-mono text-xs font-bold uppercase lg:mb-3 lg:text-base">
                                                    <span className="flex items-center gap-2 lg:gap-3">
                                                        {m && <OptionBadge option={m} size="sm" />}
                                                        {t.label}
                                                    </span>
                                                    <span className="relative tabular-nums lg:text-lg">
                                                        {bumps
                                                            .filter((b) => b.label === t.label)
                                                            .map((b) => (
                                                                <span key={b.key} className="animate-vote-pop pointer-events-none absolute -top-4 right-0 text-lg font-black text-[#e4006c] lg:text-2xl">
                                                                    +1
                                                                </span>
                                                            ))}
                                                        {pct}% ({t.count})
                                                    </span>
                                                </div>
                                                <div className="h-10 w-full overflow-hidden rounded-lg border-[3px] border-[#1b1b1b] bg-zinc-100 md:h-12 lg:h-12">
                                                    <div className={`h-full border-r-[3px] border-[#1b1b1b] transition-all duration-700 ${m?.colorClass ?? 'bg-[#00e3fd]'}`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 lg:col-span-4 lg:gap-8">
                            {isActive && <QrShare url={voteUrl} />}

                            <div className="flex flex-col rounded-2xl border-[3px] border-[#1b1b1b] bg-[#006875] p-5 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] lg:p-6">
                                <div className="mb-4 flex items-center justify-between gap-2">
                                    <h3 className="flex items-center gap-2 font-bold uppercase lg:text-lg">
                                        <Trophy className="h-5 w-5 fill-[#ffe170] text-[#ffe170] lg:h-6 lg:w-6" /> The Voters
                                    </h3>
                                    <span className="flex items-center gap-1.5 rounded-full border-[2px] border-[#1b1b1b] bg-[#ffe170] px-3 py-1 font-mono text-sm font-black text-[#1b1b1b] tabular-nums">
                                        <Users className="h-4 w-4" /> {voteCount}
                                    </span>
                                </div>

                                {voters.length === 0 ? (
                                    <p className="rounded-xl border-[2px] border-[#1b1b1b] bg-zinc-800 p-4 text-center text-sm text-zinc-300">No votes yet — scan the QR to join!</p>
                                ) : (
                                    <>
                                        {/* Fixed 5-slot window; invisible spacers keep the height steady while it rotates. */}
                                        <div className={`flex flex-col gap-3 transition-opacity duration-300 ${voterFade ? 'opacity-100' : 'opacity-0'}`}>
                                            {Array.from({ length: VOTERS_PER_PAGE }).map((_, idx) => {
                                                const v = visibleVoters[idx];
                                                if (!v) {
                                                    return (
                                                        <div key={`slot-${idx}`} className="invisible flex items-center gap-3 rounded-xl border-[2px] p-3 lg:p-3.5">
                                                            <div className="h-9 w-9 shrink-0 lg:h-11 lg:w-11" />
                                                            <div>
                                                                <p className="text-sm leading-tight">·</p>
                                                                <p className="text-[10px]">·</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={v.id} className="flex items-center gap-3 rounded-xl border-[2px] border-[#1b1b1b] bg-white p-3 text-[#1b1b1b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] lg:gap-4 lg:p-3.5">
                                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[2px] border-[#1b1b1b] font-mono text-xs font-bold lg:h-11 lg:w-11 lg:text-sm ${v.avatarBgColor}`}>{v.avatarText}</div>
                                                        <div className="overflow-hidden">
                                                            <p className="truncate text-sm font-extrabold leading-tight lg:text-base">{v.name}</p>
                                                            <p className="truncate font-mono text-[10px] text-zinc-500 uppercase lg:text-xs">Voted: {v.votedOptionLabel}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Rotation footer: only when there's more than one page to cycle. */}
                                        {pageCount > 1 && (
                                            <div className="mt-4 flex items-center justify-between border-t-[2px] border-white/20 pt-3 font-mono text-[10px] uppercase text-white/70 lg:text-xs">
                                                <span>
                                                    Showing {windowStart + 1}–{Math.min(windowStart + VOTERS_PER_PAGE, voters.length)} of {voters.length}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    {Array.from({ length: pageCount }).map((_, i) => (
                                                        <span key={i} className={`h-2 w-2 rounded-full border border-[#1b1b1b] transition-colors ${i === voterPage ? 'bg-[#ffe170]' : 'bg-white/30'}`} />
                                                    ))}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
