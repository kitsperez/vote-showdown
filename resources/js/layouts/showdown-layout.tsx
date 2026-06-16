import { Link, router, usePage } from '@inertiajs/react';
import { Compass, KeyRound, LogOut, PlusCircle, Trophy, UserCog, Users } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { FlashToast } from '@/components/showdown/flash-toast';
import type { SharedData } from '@/types';

interface ShowdownLayoutProps {
    title: string;
    subtitle?: string;
}

export default function ShowdownLayout({ title, subtitle, children }: PropsWithChildren<ShowdownLayoutProps>) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const canCreate = !!user; // any authenticated user can create a poll
    const current = typeof window !== 'undefined' ? window.location.pathname : '';

    const navItem = (href: string, label: string, icon: React.ReactNode, active: boolean) => (
        <Link
            href={href}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-[3px] px-4 py-3 font-bold transition-all ${
                active
                    ? 'border-[#1b1b1b] bg-[#00e3fd] text-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'border-transparent text-zinc-700 hover:translate-x-1 hover:bg-zinc-100'
            }`}
        >
            {icon}
            <span className="font-mono text-xs font-bold uppercase">{label}</span>
        </Link>
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#f3f3f3] font-sans text-[#1b1b1b] select-none">
            <div className="relative flex flex-1">
                <aside className="sticky top-0 z-30 hidden h-screen w-64 flex-col gap-4 border-r-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_0px_0px_0px_rgba(0,0,0,1)] md:flex">
                    <div className="mb-6 px-2 text-left">
                        <h1 className="text-2xl font-black tracking-tighter text-[#e4006c] uppercase italic">VOTE! SHOWDOWN</h1>
                        <p className="mt-0.5 font-mono text-xs font-bold tracking-wider text-zinc-500 uppercase">
                            {user?.role === 'admin' ? 'Admin Mode' : 'Creator Studio'}
                        </p>
                    </div>

                    <nav className="flex flex-col gap-3 text-left">
                        {navItem(route('dashboard'), 'Dashboard', <Compass className="h-5 w-5" />, current === '/dashboard')}
                        {navItem(route('polls.index'), 'Live Polls', <Trophy className="h-5 w-5" />, current.startsWith('/polls') && !current.endsWith('/create'))}
                        {canCreate && navItem(route('polls.create'), 'Create Poll', <PlusCircle className="h-5 w-5" />, current.endsWith('/create'))}
                        {user?.role === 'admin' && navItem(route('admin.users.index'), 'Users', <Users className="h-5 w-5" />, current.startsWith('/admin/users'))}
                    </nav>

                    <div className="mt-auto rounded-xl border-[3px] border-[#1b1b1b] bg-[#ffe170] p-4 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="mb-3 flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[2px] border-[#1b1b1b] font-mono text-xs font-bold ${user?.avatarBgColor ?? 'bg-[#ffd9e0]'}`}>
                                {user?.avatarText}
                            </div>
                            <div className="overflow-hidden">
                                <p className="truncate font-mono text-[11px] font-bold uppercase">{user?.name}</p>
                                <p className="font-mono text-[9px] font-medium opacity-70 uppercase">{user?.role}</p>
                            </div>
                        </div>
                        <div className="mb-2 flex flex-col gap-1.5">
                            <Link href={route('profile.edit')} className="flex items-center gap-2 rounded border-[2px] border-[#1b1b1b] bg-white px-3 py-1.5 font-mono text-[11px] font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5">
                                <UserCog className="h-3.5 w-3.5" /> Edit profile
                            </Link>
                            <Link href={route('password.edit')} className="flex items-center gap-2 rounded border-[2px] border-[#1b1b1b] bg-white px-3 py-1.5 font-mono text-[11px] font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5">
                                <KeyRound className="h-3.5 w-3.5" /> Change password
                            </Link>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.post(route('logout'))}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded border-[2px] border-[#1b1b1b] bg-[#e4006c] py-2 font-mono text-xs font-bold tracking-wider text-white uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                            <LogOut className="h-4 w-4" /> Log out
                        </button>
                    </div>
                </aside>

                <div className="flex min-h-screen flex-grow flex-col">
                    <header className="flex flex-col items-start justify-between gap-4 border-b-[3px] border-[#1b1b1b] bg-white p-6 text-left sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic md:text-5xl">{title}</h1>
                            {subtitle && <p className="mt-1 font-mono text-sm font-bold text-[#006875] uppercase">{subtitle}</p>}
                        </div>
                    </header>

                    <main className="flex flex-grow flex-col">{children}</main>
                </div>
            </div>

            <FlashToast />
        </div>
    );
}
