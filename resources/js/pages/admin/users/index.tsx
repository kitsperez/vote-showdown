import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ShowdownLayout from '@/layouts/showdown-layout';
import type { SharedData } from '@/types';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: string;
    isGuest: boolean;
    pollsCount: number;
    avatarText: string;
    avatarBgColor: string;
}

interface UsersIndexProps {
    users: UserRow[];
}

const roleStyles: Record<string, string> = {
    admin: 'bg-[#e4006c] text-white',
    creator: 'bg-[#00e3fd] text-[#1b1b1b]',
};

export default function UsersIndex({ users }: UsersIndexProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <ShowdownLayout title="User Management" subtitle="Admin controls">
            <Head title="Users" />

            <div className="flex flex-col gap-6 p-6 md:p-10">
                <div className="flex items-center justify-between">
                    <p className="font-mono text-xs font-bold text-zinc-500 uppercase">{users.length} users</p>
                    <Link
                        href={route('admin.users.create')}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border-[3px] border-[#1b1b1b] bg-[#ffe170] px-5 py-2.5 font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5"
                    >
                        <PlusCircle className="h-4 w-4" /> New user
                    </Link>
                </div>

                <div className="overflow-hidden rounded-2xl border-[3px] border-[#1b1b1b] bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex flex-col divide-y-[2px] divide-[#1b1b1b]">
                        {users.map((u) => {
                            const isSelf = auth.user?.id === u.id;
                            return (
                                <div key={u.id} className="flex items-center gap-4 p-4">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[2px] border-[#1b1b1b] font-mono text-xs font-bold ${u.avatarBgColor}`}>
                                        {u.avatarText}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-extrabold">
                                            {u.name} {isSelf && <span className="font-mono text-[10px] text-zinc-400 uppercase">(you)</span>}
                                        </p>
                                        <p className="truncate font-mono text-[11px] text-zinc-500">{u.email}</p>
                                    </div>
                                    <span className={`hidden shrink-0 rounded border-[2px] border-[#1b1b1b] px-2 py-0.5 font-mono text-[10px] font-bold uppercase sm:inline ${roleStyles[u.role]}`}>
                                        {u.role}
                                    </span>
                                    {u.isGuest && <span className="hidden shrink-0 font-mono text-[10px] text-zinc-400 uppercase md:inline">guest</span>}
                                    <span className="hidden shrink-0 font-mono text-[11px] font-bold text-zinc-500 uppercase lg:inline">{u.pollsCount} polls</span>

                                    <Link
                                        href={route('admin.users.edit', u.id)}
                                        className="shrink-0 cursor-pointer rounded-lg border-[2px] border-[#1b1b1b] bg-white p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5"
                                        title="Edit"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Link>

                                    {!isSelf && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="shrink-0 cursor-pointer rounded-lg border-[2px] border-[#1b1b1b] bg-red-100 p-2 text-red-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5" title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="border-[3px] border-[#1b1b1b] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                                <DialogTitle className="font-black uppercase">Delete {u.name}?</DialogTitle>
                                                <DialogDescription className="text-zinc-600">
                                                    This permanently deletes the account{u.pollsCount > 0 ? ` and its ${u.pollsCount} poll(s)` : ''}. This cannot be undone.
                                                </DialogDescription>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <button className="rounded-lg border-[2px] border-[#1b1b1b] bg-white px-4 py-2 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                            Cancel
                                                        </button>
                                                    </DialogClose>
                                                    <DialogClose asChild>
                                                        <button
                                                            onClick={() => router.delete(route('admin.users.destroy', u.id), { preserveScroll: true })}
                                                            className="rounded-lg border-[2px] border-[#1b1b1b] bg-red-200 px-4 py-2 font-mono text-xs font-black uppercase text-red-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                        >
                                                            Delete user
                                                        </button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </ShowdownLayout>
    );
}
