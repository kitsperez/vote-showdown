import { router } from '@inertiajs/react';
import { Lock, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CountdownBadge } from '@/components/showdown/countdown-badge';
import { OptionBadge } from '@/components/showdown/option-badge';
import { QrShare } from '@/components/showdown/qr-share';
import { useCountdown } from '@/hooks/use-countdown';
import { usePublicPollChannel } from '@/hooks/use-public-poll-channel';
import GuestLayout from '@/layouts/guest-layout';
import type { Poll, VoterEntry } from '@/types/models';

interface PublicPollProps {
    poll: Poll;
    voters: VoterEntry[];
    hasVoted: boolean;
}

/**
 * Public guest page — same design as the authed /polls/{id} page, minus the sidebar.
 * Guests vote by email (polling for liveness; no private Echo channel).
 */
export default function PublicPoll({ poll, voters, hasVoted: initialVoted }: PublicPollProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [hasVoted, setHasVoted] = useState(initialVoted);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState(poll.status);
    const [endsAt, setEndsAt] = useState<string | null>(poll.endsAt);

    useEffect(() => {
        setStatus(poll.status);
        setEndsAt(poll.endsAt);
        setHasVoted(initialVoted);
    }, [poll.id, poll.status, poll.endsAt, initialVoted]);

    usePublicPollChannel(poll.id, {
        onStatus: (payload) => {
            setStatus(payload.status);
            setEndsAt(payload.endsAt);
            router.reload({ only: ['poll', 'voters', 'hasVoted'] });
        },
    });

    const remaining = useCountdown(endsAt);
    const isActive = status === 'active' && remaining > 0;
    const locked = poll.requiresPassword && !poll.unlocked;
    const total = useMemo(() => poll.options.reduce((s, o) => s + o.count, 0) || 1, [poll.options]);
    const winner = useMemo(() => {
        if (poll.options.length === 0) return null;
        const max = Math.max(...poll.options.map((o) => o.count));
        if (max <= 0) return null;
        const top = poll.options.filter((o) => o.count === max);
        return top.length === 1 ? top[0] : null;
    }, [poll.options]);
    const voteUrl = route('public-poll.show', poll.id);

    useEffect(() => {
        if (!isActive) return;
        const id = setInterval(() => router.reload({ only: ['poll', 'voters'] }), 4000);
        return () => clearInterval(id);
    }, [isActive]);

    useEffect(() => {
        if (status !== 'active' || remaining > 0) return;
        router.reload({ only: ['poll', 'voters', 'hasVoted'] });
        const id = setInterval(() => router.reload({ only: ['poll', 'voters', 'hasVoted'] }), 2500);
        return () => clearInterval(id);
    }, [status, remaining, poll.id]);

    const unlock = (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        router.post(route('polls.unlock', poll.id), { password }, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const vote = (e: React.FormEvent) => {
        e.preventDefault();
        if (selected === null || !email.includes('@')) return;
        setBusy(true);
        router.post(
            route('public-poll.vote', poll.id),
            { poll_option_id: selected, email, name },
            { preserveScroll: true, onSuccess: () => setHasVoted(true), onFinish: () => setBusy(false) },
        );
    };

    const showVoting = isActive && !locked && !hasVoted;

    return (
        <GuestLayout title={poll.title}>
            <div className="relative flex flex-col gap-8">
                {/* Countdown */}
                {isActive && (
                    <div className="flex justify-center">
                        <CountdownBadge seconds={remaining} />
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
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic md:text-4xl">{poll.title}</h1>
                            {poll.description && <p className="mt-2 font-medium text-zinc-600 italic">"{poll.description}"</p>}
                        </div>

                        {/* Password gate */}
                        {isActive && locked && (
                            <form onSubmit={unlock} className="rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <label className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase">
                                    <Lock className="h-4 w-4" /> This showdown is password protected
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="mb-4 h-12 w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 font-bold focus:border-[#e4006c] focus:outline-none"
                                />
                                <button disabled={busy} className="cursor-pointer rounded-xl border-[3px] border-[#1b1b1b] bg-[#ffe170] px-6 py-3 font-mono text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-50">
                                    🔓 Unlock
                                </button>
                            </form>
                        )}

                        {/* Voting */}
                        {showVoting && (
                            <form onSubmit={vote} className="flex flex-col gap-4">
                                {poll.options.map((opt) => (
                                    <button
                                        type="button"
                                        key={opt.id}
                                        onClick={() => setSelected(opt.id)}
                                        className={`flex items-center gap-5 rounded-xl border-[3px] border-[#1b1b1b] p-5 text-left shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none ${
                                            selected === opt.id ? opt.colorClass : 'bg-white hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
                                        }`}
                                    >
                                        <OptionBadge option={opt} />
                                        <span className="text-lg font-extrabold">{opt.label}</span>
                                    </button>
                                ))}

                                <div className="mt-2 rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                    <label className="mb-2 block font-mono text-xs font-bold uppercase">📧 Email to vote</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        required
                                        className="mb-3 h-12 w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 font-bold focus:border-[#e4006c] focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Display name (optional)"
                                        className="mb-4 h-12 w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 font-bold focus:border-[#e4006c] focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={busy || selected === null}
                                        className="w-full cursor-pointer rounded-xl border-[3px] border-[#1b1b1b] bg-[#e4006c] py-4 font-mono text-base font-black tracking-wider text-white uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-50"
                                    >
                                        Cast my showdown vote! ⚡
                                    </button>
                                    <p className="mt-3 text-center font-mono text-[11px] text-zinc-400 italic">One vote per email. Don't be a cheeky voter!</p>
                                </div>
                            </form>
                        )}

                        {/* Tally */}
                        {(!showVoting || hasVoted) && !locked && (
                            <div className="rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-8">
                                {hasVoted && isActive && (
                                    <div className="mb-6 rounded-lg border-[2px] border-emerald-500 bg-emerald-100 p-3 text-center font-bold text-emerald-800">✓ Your vote is locked in — watch the race!</div>
                                )}
                                <h2 className="mb-6 text-xl font-black uppercase">{poll.status === 'ended' ? 'The Final Tally' : 'Live Tally'}</h2>
                                <div className="flex flex-col gap-6">
                                    {poll.options.map((opt) => {
                                        const pct = Math.round((opt.count / total) * 100);
                                        return (
                                            <div key={opt.id}>
                                                <div className="mb-2 flex items-center justify-between font-mono text-xs font-bold uppercase">
                                                    <span className="flex items-center gap-2">
                                                        <OptionBadge option={opt} size="sm" />
                                                        {opt.label}
                                                    </span>
                                                    <span>{pct}% ({opt.count})</span>
                                                </div>
                                                <div className="h-9 w-full overflow-hidden rounded-lg border-[3px] border-[#1b1b1b] bg-zinc-100">
                                                    <div className={`h-full border-r-[3px] border-[#1b1b1b] transition-all duration-700 ease-out ${opt.colorClass}`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Side column: QR + voters */}
                    <div className="flex flex-col gap-6 lg:col-span-4">
                        {isActive && <QrShare url={voteUrl} />}

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
