import { Head, Link, router } from '@inertiajs/react';
import { Pencil, PlusCircle, RotateCcw, Square, Trash2, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ShowdownLayout from '@/layouts/showdown-layout';
import { OptionBadge } from '@/components/showdown/option-badge';
import { QrShare } from '@/components/showdown/qr-share';
import { formatCountdown, useCountdown } from '@/hooks/use-countdown';
import { usePollChannel } from '@/hooks/use-poll-channel';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Poll, PollStatus, TallyEntry, VoterEntry } from '@/types/models';

interface ShowProps {
    poll: Poll;
    voters: VoterEntry[];
    canControl: boolean;
    canRestart: boolean;
    canClose: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canModerateVotes: boolean;
}

export default function PollsShow({ poll, voters: initialVoters, canControl, canRestart, canClose, canEdit, canDelete, canModerateVotes }: ShowProps) {
    const [tally, setTally] = useState<TallyEntry[]>(() => poll.options.map((o) => ({ poll_option_id: o.id, label: o.label, count: o.count })));
    const [voters, setVoters] = useState<VoterEntry[]>(initialVoters);
    const [status, setStatus] = useState<PollStatus>(poll.status);
    const [endsAt, setEndsAt] = useState<string | null>(poll.endsAt);
    const joinUrl = route('public-poll.show', poll.id);

    // Re-sync when navigating between polls.
    useEffect(() => {
        setTally(poll.options.map((o) => ({ poll_option_id: o.id, label: o.label, count: o.count })));
        setStatus(poll.status);
        setEndsAt(poll.endsAt);
        setVoters(initialVoters);
    }, [poll.id, poll.status, poll.endsAt, poll.options, initialVoters]);

    usePollChannel(poll.id, {
        onTally: (incoming) => setTally(incoming),
        onTicker: (voter) =>
            setVoters((prev) => [{ id: Date.now(), ...voter }, ...prev].slice(0, 20)),
        onStatus: (payload) => {
            setStatus(payload.status);
            setEndsAt(payload.endsAt);
            router.reload({ only: ['poll', 'voters'] });
        },
    });

    const remaining = useCountdown(endsAt);
    const isActive = status === 'active' && remaining > 0;
    const total = useMemo(() => tally.reduce((sum, t) => sum + t.count, 0) || 1, [tally]);
    const meta = (id: number) => poll.options.find((o) => o.id === id);
    const winner = useMemo(() => {
        if (tally.length === 0) return null;
        const max = Math.max(...tally.map((t) => t.count));
        if (max <= 0) return null;
        const top = tally.filter((t) => t.count === max);
        return top.length === 1 ? top[0] : null;
    }, [tally]);

    // Polling backstop for counts AND the voters feed if Reverb is unreachable or a
    // broadcast is missed (no live +1, just correctness). Mirrors public-results so this
    // read-only monitor stays in sync the same way the public projection does.
    useEffect(() => {
        if (!isActive) return;
        const id = setInterval(() => router.reload({ only: ['poll', 'voters'] }), 6000);
        return () => clearInterval(id);
    }, [isActive]);

    useEffect(() => {
        if (status !== 'active' || remaining > 0) return;
        router.reload({ only: ['poll', 'voters'] });
        const id = setInterval(() => router.reload({ only: ['poll', 'voters'] }), 2500);
        return () => clearInterval(id);
    }, [status, remaining, poll.id]);

    const control = (action: 'close' | 'add-time' | 'restart', payload: Record<string, number> = {}) =>
        router.post(route(`polls.control.${action}`, poll.id), payload, { preserveScroll: true });

    return (
        <ShowdownLayout title={poll.title} subtitle={isActive ? 'Live showdown in progress' : status === 'ended' ? 'Final tally' : 'Draft'}>
            <Head title={poll.title} />

            <div className="relative flex flex-col gap-8 p-6 md:p-10">
                {/* Countdown */}
                {isActive && (
                    <div className="fixed top-6 right-6 z-40">
                        <div className="flex h-20 w-20 rotate-6 animate-pulse flex-col items-center justify-center rounded-full border-[3px] border-[#1b1b1b] bg-[#1b1b1b] p-3 text-[#ffe170] shadow-[6px_6px_0px_0px_rgba(233,196,0,1)]">
                            <span className="mb-1 font-mono text-[9px] leading-none text-zinc-300 uppercase">Ends In</span>
                            <span className="font-mono text-lg leading-none font-black tabular-nums">{formatCountdown(remaining)}</span>
                        </div>
                    </div>
                )}

                {/* Winner banner when ended */}
                {status === 'ended' && (
                    <div className="text-center">
                        <h2 className="mb-4 -rotate-1 text-3xl font-black tracking-tighter text-[#e4006c] uppercase italic md:text-5xl">THE WINNER IS… 🏆</h2>
                        <div className="inline-block rotate-1 rounded-2xl border-[3px] border-[#1b1b1b] bg-[#ffe170] px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-3xl font-black uppercase md:text-5xl">{winner?.label ?? 'No winner'}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Main column */}
                    <div className="flex flex-col gap-6 lg:col-span-8">
                        {poll.description && <p className="font-medium text-zinc-600 italic">"{poll.description}"</p>}

                        {/* Read-only on the backend: voting happens on the public pages only. The tally
                            here auto-updates live (Reverb + polling backstop), same as the public results. */}
                        {isActive && (
                            <div className="rounded-lg border-[2px] border-[#1b1b1b] bg-[#9cf0ff] p-4 text-center font-mono text-xs font-bold uppercase">
                                👀 Live monitor — share the public link or QR for people to vote
                            </div>
                        )}

                        {/* Tally bars (always shown) */}
                        <div className="rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-8">
                            <h2 className="mb-6 text-xl font-black uppercase">{status === 'ended' ? 'The Final Tally' : 'Live Tally'}</h2>
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
                                                <span>{pct}% ({t.count})</span>
                                            </div>
                                            <div className="h-9 w-full overflow-hidden rounded-lg border-[3px] border-[#1b1b1b] bg-zinc-100">
                                                <div className={`h-full border-r-[3px] border-[#1b1b1b] transition-all duration-700 ease-out ${m?.colorClass ?? 'bg-[#00e3fd]'}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Side column: QR share + voters + admin controls */}
                    <div className="flex flex-col gap-6 lg:col-span-4">
                        {isActive && <QrShare url={joinUrl} />}

                        {/* Results-only / projection link */}
                        <a
                            href={route('public-poll.results', poll.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-xl border-[3px] border-[#1b1b1b] bg-[#9cf0ff] px-4 py-2.5 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                            <Trophy className="h-4 w-4" /> Open results view
                        </a>

                        {(canEdit || canClose || canControl || canRestart || canDelete) && (
                            <div className="rounded-2xl border-[3px] border-[#1b1b1b] bg-[#006875] p-5 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <h3 className="mb-4 font-mono text-sm font-bold uppercase">Manage</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {canEdit && (
                                        <Link href={route('polls.edit', poll.id)} className="flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#1b1b1b] bg-white py-2 font-mono text-[11px] font-bold text-[#1b1b1b] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5">
                                            <Pencil className="h-3.5 w-3.5" />Edit
                                        </Link>
                                    )}
                                    {canClose && status === 'active' && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#1b1b1b] bg-[#e4006c] py-2 font-mono text-[11px] font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5">
                                                    <Square className="h-3.5 w-3.5" />Close
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="border-[3px] border-[#1b1b1b] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                                <DialogTitle className="font-black uppercase">Close this showdown?</DialogTitle>
                                                <DialogDescription className="text-zinc-600">
                                                    This will end the poll and stop accepting votes.
                                                </DialogDescription>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <button className="rounded-lg border-[2px] border-[#1b1b1b] bg-white px-4 py-2 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                            Cancel
                                                        </button>
                                                    </DialogClose>
                                                    <DialogClose asChild>
                                                        <button
                                                            onClick={() => control('close')}
                                                            className="rounded-lg border-[2px] border-[#1b1b1b] bg-[#e4006c] px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                        >
                                                            Close poll
                                                        </button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    {canControl && (
                                        <>
                                            <button onClick={() => control('add-time', { seconds: 30 })} className="flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#1b1b1b] bg-[#ffe170] py-2 font-mono text-[11px] font-bold text-[#1b1b1b] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5"><PlusCircle className="h-3.5 w-3.5" />30s</button>
                                            <button onClick={() => control('add-time', { seconds: 60 })} className="flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#1b1b1b] bg-[#ffe170] py-2 font-mono text-[11px] font-bold text-[#1b1b1b] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5"><PlusCircle className="h-3.5 w-3.5" />60s</button>
                                        </>
                                    )}
                                    {canRestart && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#1b1b1b] bg-white py-2 font-mono text-[11px] font-bold text-[#1b1b1b] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5">
                                                    <RotateCcw className="h-3.5 w-3.5" />Restart
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="border-[3px] border-[#1b1b1b] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                                <DialogTitle className="font-black uppercase">Reset and start a new round?</DialogTitle>
                                                <DialogDescription className="text-zinc-600">
                                                    This clears all current votes and restarts the countdown.
                                                </DialogDescription>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <button className="rounded-lg border-[2px] border-[#1b1b1b] bg-white px-4 py-2 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                            Cancel
                                                        </button>
                                                    </DialogClose>
                                                    <DialogClose asChild>
                                                        <button
                                                            onClick={() => control('restart')}
                                                            className="rounded-lg border-[2px] border-[#1b1b1b] bg-[#00e3fd] px-4 py-2 font-mono text-xs font-black uppercase text-[#1b1b1b] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                        >
                                                            Reset round
                                                        </button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    {canDelete && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#1b1b1b] bg-red-200 py-2 font-mono text-[11px] font-bold text-red-800 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5">
                                                    <Trash2 className="h-3.5 w-3.5" />Delete
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="border-[3px] border-[#1b1b1b] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                                <DialogTitle className="font-black uppercase">Delete this poll?</DialogTitle>
                                                <DialogDescription className="text-zinc-600">
                                                    This permanently deletes the poll, its options, and its votes.
                                                </DialogDescription>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <button className="rounded-lg border-[2px] border-[#1b1b1b] bg-white px-4 py-2 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                            Cancel
                                                        </button>
                                                    </DialogClose>
                                                    <DialogClose asChild>
                                                        <button
                                                            onClick={() => router.delete(route('polls.destroy', poll.id))}
                                                            className="rounded-lg border-[2px] border-[#1b1b1b] bg-red-200 px-4 py-2 font-mono text-xs font-black uppercase text-red-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                        >
                                                            Delete poll
                                                        </button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col rounded-2xl border-[3px] border-[#1b1b1b] bg-[#006875] p-5 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="mb-4 flex items-center gap-2 font-bold uppercase"><Trophy className="h-5 w-5 fill-[#ffe170] text-[#ffe170]" /> The Voters</h3>
                            <div className="custom-scrollbar flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
                                {voters.length === 0 && <p className="rounded-xl border-[2px] border-[#1b1b1b] bg-zinc-800 p-4 text-center text-sm text-zinc-300">No votes yet — be the first!</p>}
                                {voters.map((v) => (
                                    <div key={v.id} className="flex items-center gap-3 rounded-xl border-[2px] border-[#1b1b1b] bg-white p-3 text-[#1b1b1b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[2px] border-[#1b1b1b] font-mono text-xs font-bold ${v.avatarBgColor}`}>{v.avatarText}</div>
                                        <div className="overflow-hidden">
                                            <p className="truncate text-sm font-extrabold leading-tight">{v.name}</p>
                                            <p className="font-mono text-[10px] text-zinc-500 uppercase">Voted: {v.votedOptionLabel}</p>
                                        </div>
                                        {canModerateVotes && v.voterKey && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button title="Remove this voter's vote" className="ml-auto shrink-0 cursor-pointer rounded-lg border-[2px] border-[#1b1b1b] bg-red-100 p-1.5 text-red-700 transition-colors hover:bg-red-200">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="border-[3px] border-[#1b1b1b] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                                    <DialogTitle className="font-black uppercase">Remove this voter's vote?</DialogTitle>
                                                    <DialogDescription className="text-zinc-600">
                                                        This deletes {v.name}'s vote(s) on this poll and updates the tally for everyone. This cannot be undone.
                                                    </DialogDescription>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <button className="rounded-lg border-[2px] border-[#1b1b1b] bg-white px-4 py-2 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                                Cancel
                                                            </button>
                                                        </DialogClose>
                                                        <DialogClose asChild>
                                                            <button
                                                                onClick={() => router.delete(route('polls.voter-votes.destroy', poll.id), { data: { voter_key: v.voterKey }, preserveScroll: true })}
                                                                className="rounded-lg border-[2px] border-[#1b1b1b] bg-red-200 px-4 py-2 font-mono text-xs font-black uppercase text-red-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                            >
                                                                Remove vote
                                                            </button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ShowdownLayout>
    );
}
