import { router } from '@inertiajs/react';
import { Clock, Lock, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { OptionBadge } from '@/components/showdown/option-badge';
import { QrShare } from '@/components/showdown/qr-share';
import { useCountdown } from '@/hooks/use-countdown';
import GuestLayout from '@/layouts/guest-layout';
import type { Poll, VoterEntry } from '@/types/models';

interface PublicPollProps {
    poll: Poll;
    voters: VoterEntry[];
    hasVoted: boolean;
}

export default function PublicPoll({ poll, voters, hasVoted: initialVoted }: PublicPollProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [hasVoted, setHasVoted] = useState(initialVoted);
    const [busy, setBusy] = useState(false);

    const remaining = useCountdown(poll.endsAt);
    const isActive = poll.status === 'active' && remaining > 0;
    const locked = poll.requiresPassword && !poll.unlocked;
    const total = useMemo(() => poll.options.reduce((s, o) => s + o.count, 0) || 1, [poll.options]);
    const voteUrl = route('public-poll.show', poll.id);

    // Polling liveness for guests (no private Echo channel).
    useEffect(() => {
        if (!isActive) return;
        const id = setInterval(() => router.reload({ only: ['poll', 'voters'] }), 4000);
        return () => clearInterval(id);
    }, [isActive]);

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

    const canVote = isActive && !locked && !hasVoted;

    return (
        <GuestLayout title={poll.title}>
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main poll column */}
                <div className="mx-auto w-full max-w-lg lg:col-span-2 lg:mx-0">
                    {isActive && (
                        <div className="mb-4 flex items-center justify-center gap-2 font-mono text-sm font-bold text-[#006875] uppercase">
                            <Clock className="h-4 w-4" /> Ends in {remaining}s
                        </div>
                    )}

                    <h1 className="text-center text-3xl font-black tracking-tighter uppercase italic md:text-4xl">{poll.title}</h1>
                    {poll.description && <p className="mt-2 text-center text-sm font-medium text-zinc-600 italic">"{poll.description}"</p>}

                    {/* Password gate */}
                    {locked && (
                        <form onSubmit={unlock} className="mt-8 rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
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
                            <button disabled={busy} className="w-full cursor-pointer rounded-xl border-[3px] border-[#1b1b1b] bg-[#ffe170] py-3 font-mono text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-50">
                                🔓 Unlock
                            </button>
                        </form>
                    )}

                    {/* Voting */}
                    {canVote && (
                        <form onSubmit={vote} className="mt-8 flex flex-col gap-4">
                            {poll.options.map((opt) => (
                                <button
                                    type="button"
                                    key={opt.id}
                                    onClick={() => setSelected(opt.id)}
                                    className={`flex items-center gap-5 rounded-xl border-[3px] border-[#1b1b1b] p-4 text-left shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none ${
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

                    {/* Results / leaderboard */}
                    {!canVote && !locked && (
                        <div className="mt-8 rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            {hasVoted && <div className="mb-5 rounded-lg border-[2px] border-emerald-500 bg-emerald-100 p-3 text-center font-bold text-emerald-800">✓ Your vote is cast!</div>}
                            <h2 className="mb-5 flex items-center gap-2 text-xl font-black uppercase">
                                <Trophy className="h-5 w-5 fill-[#ffe170] text-[#ffe170]" /> {poll.status === 'ended' ? 'Final Tally' : 'Live Leaderboard'}
                            </h2>
                            <div className="flex flex-col gap-4">
                                {poll.options.map((opt) => {
                                    const pct = Math.round((opt.count / total) * 100);
                                    return (
                                        <div key={opt.id}>
                                            <div className="mb-1.5 flex justify-between font-mono text-xs font-bold uppercase">
                                                <span>{opt.label}</span>
                                                <span>{pct}% ({opt.count})</span>
                                            </div>
                                            <div className="h-7 w-full overflow-hidden rounded-md border-[2px] border-[#1b1b1b] bg-zinc-100">
                                                <div className={`h-full border-r-[2px] border-[#1b1b1b] transition-all duration-500 ${opt.colorClass}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
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
