import { Head, Link } from '@inertiajs/react';
import { Activity, Gauge, PlusCircle, Trophy, Users } from 'lucide-react';
import ShowdownLayout from '@/layouts/showdown-layout';
import type { UserRole } from '@/types';
import type { Poll, PollMetrics } from '@/types/models';

interface DashboardProps {
    role: UserRole;
    activePoll: Poll | null;
    polls: Poll[];
    metrics: PollMetrics | null;
}

const statusStyles: Record<string, string> = {
    active: 'bg-[#00e3fd] text-[#1b1b1b]',
    ended: 'bg-zinc-300 text-zinc-700',
    draft: 'bg-[#ffe170] text-[#1b1b1b]',
};

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    return (
        <div className={`rounded-2xl border-[3px] border-[#1b1b1b] ${color} p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
            <div className="mb-2 flex items-center gap-2">{icon}</div>
            <p className="font-mono text-3xl font-black">{value}</p>
            <p className="font-mono text-[11px] font-bold uppercase opacity-70">{label}</p>
        </div>
    );
}

export default function Dashboard({ role, activePoll, polls, metrics }: DashboardProps) {
    const canCreate = role === 'creator' || role === 'admin';

    return (
        <ShowdownLayout
            title={role === 'admin' ? 'Admin Control Hub' : 'Dashboard'}
            subtitle={role === 'admin' ? 'Maximum interactive oversight' : 'Build something electrifying!'}
        >
            <Head title="Dashboard" />

            <div className="flex flex-col gap-8 p-6 md:p-10">
                {activePoll ? (
                    <div className="rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-8">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="flex h-3 w-3 animate-pulse rounded-full bg-[#e4006c]" />
                                <h2 className="text-2xl font-black uppercase">Live Now</h2>
                            </div>
                            <Link
                                href={route('polls.show', activePoll.id)}
                                className="cursor-pointer rounded-xl border-[3px] border-[#1b1b1b] bg-[#e4006c] px-5 py-2.5 font-mono text-xs font-bold tracking-wider text-white uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                            >
                                Open Showdown →
                            </Link>
                        </div>
                        <h3 className="text-xl font-black uppercase italic md:text-3xl">{activePoll.title}</h3>

                        {metrics && (
                            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <MetricCard icon={<Users className="h-5 w-5" />} label="Total Voters" value={metrics.totalVoters} color="bg-[#9cf0ff]" />
                                <MetricCard icon={<Activity className="h-5 w-5" />} label="Votes / min" value={metrics.velocityPerMinute} color="bg-[#ffe170]" />
                                <MetricCard icon={<Gauge className="h-5 w-5" />} label="Engagement" value={`${metrics.engagementRate}%`} color="bg-[#ffd9e0]" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl border-[3px] border-dashed border-[#1b1b1b] bg-white p-8 text-center">
                        <p className="font-mono text-sm font-bold text-zinc-500 uppercase">No active showdown right now.</p>
                        {canCreate && (
                            <Link
                                href={route('polls.create')}
                                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border-[3px] border-[#1b1b1b] bg-[#ffe170] px-5 py-3 font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5"
                            >
                                <PlusCircle className="h-4 w-4" /> Launch a new poll
                            </Link>
                        )}
                    </div>
                )}

                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-black uppercase">{role === 'admin' ? 'All Polls' : 'Your Polls'}</h2>
                        {canCreate && (
                            <Link href={route('polls.create')} className="flex cursor-pointer items-center gap-2 font-mono text-xs font-bold text-[#e4006c] uppercase hover:underline">
                                <PlusCircle className="h-4 w-4" /> New
                            </Link>
                        )}
                    </div>

                    {polls.length === 0 ? (
                        <p className="font-mono text-sm text-zinc-500">Nothing here yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {polls.map((poll) => (
                                <Link
                                    key={poll.id}
                                    href={route('polls.show', poll.id)}
                                    className="group flex flex-col gap-3 rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-5 text-left shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <span className={`w-fit rounded border-[2px] border-[#1b1b1b] px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${statusStyles[poll.status]}`}>
                                        {poll.status}
                                    </span>
                                    <h3 className="text-lg font-black uppercase">{poll.title}</h3>
                                    <p className="mt-auto flex items-center gap-2 font-mono text-xs font-bold text-zinc-500 uppercase">
                                        <Trophy className="h-4 w-4" /> {poll.totalVotes} votes · {poll.options.length} options
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ShowdownLayout>
    );
}
