import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Trophy, Vote, Zap } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col bg-[#f3f3f3] font-sans text-[#1b1b1b]">
                {/* Nav */}
                <header className="flex items-center justify-between border-b-[3px] border-[#1b1b1b] bg-white px-6 py-4">
                    <span className="text-xl font-black tracking-tighter text-[#e4006c] uppercase italic md:text-2xl">VOTE! SHOWDOWN</span>
                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="cursor-pointer rounded-xl border-[3px] border-[#1b1b1b] bg-[#00e3fd] px-5 py-2 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="px-3 py-2 font-mono text-xs font-bold uppercase hover:text-[#e4006c]">
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="cursor-pointer rounded-xl border-[3px] border-[#1b1b1b] bg-[#ffe170] px-5 py-2 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* Hero */}
                <main className="mx-auto flex w-full max-w-4xl flex-grow flex-col items-center justify-center gap-8 px-6 py-16 text-center">
                    <div className="inline-block -rotate-2 rounded-xl border-[3px] border-[#1b1b1b] bg-[#00e3fd] px-4 py-1.5 font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        ⚡ Real-time · High-energy · Live
                    </div>

                    <h1 className="text-5xl font-black tracking-tighter uppercase italic md:text-7xl">
                        Settle it with a <span className="text-[#e4006c]">Showdown</span>
                    </h1>
                    <p className="max-w-2xl text-lg font-medium text-zinc-600">
                        Spin up a poll, drop a QR code, and watch the votes race in live. Cartoon chaos, real-time tallies, one electrifying winner.
                    </p>

                    <Link
                        href={auth.user ? route('dashboard') : route('register')}
                        className="cursor-pointer rounded-xl border-[3px] border-[#1b1b1b] bg-[#e4006c] px-10 py-5 text-xl font-black tracking-wider text-white uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                    >
                        {auth.user ? 'Go to dashboard →' : 'Start a showdown →'}
                    </Link>

                    {/* Feature cards */}
                    <div className="mt-10 grid w-full grid-cols-1 gap-6 text-left sm:grid-cols-3">
                        {[
                            { icon: <Vote className="h-7 w-7" />, bg: 'bg-[#ffe170]', title: 'Build a poll', body: '2–10 options, countdown or deadline, optional password.' },
                            { icon: <Zap className="h-7 w-7" />, bg: 'bg-[#9cf0ff]', title: 'Scan & vote', body: 'Share a link or QR — anyone votes in seconds, no fuss.' },
                            { icon: <Trophy className="h-7 w-7" />, bg: 'bg-[#ffd9e0]', title: 'Watch live', body: 'Tallies race in real time and crown a winner.' },
                        ].map((f) => (
                            <div key={f.title} className={`rounded-2xl border-[3px] border-[#1b1b1b] ${f.bg} p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-[3px] border-[#1b1b1b] bg-white">{f.icon}</div>
                                <h3 className="mb-1 text-lg font-black uppercase">{f.title}</h3>
                                <p className="text-sm font-medium text-zinc-700">{f.body}</p>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="border-t-[3px] border-[#1b1b1b] bg-zinc-200 px-6 py-6 text-center font-mono text-xs font-bold text-zinc-700 uppercase">
                    © 2026 Electric Pulse Voting
                </footer>
            </div>
        </>
    );
}
