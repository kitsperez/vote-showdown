import { Head, Link } from '@inertiajs/react';
import { PlusCircle, Trophy } from 'lucide-react';
import ShowdownLayout from '@/layouts/showdown-layout';
import type { Poll } from '@/types/models';

const statusStyles: Record<string, string> = {
    active: 'bg-[#00e3fd] text-[#1b1b1b]',
    ended: 'bg-zinc-300 text-zinc-700',
    draft: 'bg-[#ffe170] text-[#1b1b1b]',
};

export default function PollsIndex({ polls }: { polls: Poll[] }) {
    const canCreate = true; // any authenticated user can create a poll

    return (
        <ShowdownLayout title="Tally Board" subtitle="Every showdown, live and archived">
            <Head title="Polls" />

            <div className="flex flex-col gap-6 p-6 md:p-10">
                {canCreate && (
                    <Link
                        href={route('polls.create')}
                        className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border-[3px] border-[#1b1b1b] bg-[#ffe170] px-5 py-3 font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                        <PlusCircle className="h-4 w-4" /> Create Poll
                    </Link>
                )}

                {polls.length === 0 ? (
                    <p className="font-mono text-sm text-zinc-500">No polls yet.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {polls.map((poll) => (
                            <Link
                                key={poll.id}
                                href={route('polls.show', poll.id)}
                                className="flex flex-col gap-3 rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-5 text-left shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <span className={`w-fit rounded border-[2px] border-[#1b1b1b] px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${statusStyles[poll.status]}`}>
                                    {poll.status}
                                </span>
                                <h3 className="text-lg font-black uppercase">{poll.title}</h3>
                                {poll.description && <p className="line-clamp-2 text-sm font-medium text-zinc-500 italic">"{poll.description}"</p>}
                                <p className="mt-auto flex items-center gap-2 font-mono text-xs font-bold text-zinc-500 uppercase">
                                    <Trophy className="h-4 w-4" /> {poll.totalVotes} votes · {poll.options.length} options
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </ShowdownLayout>
    );
}
