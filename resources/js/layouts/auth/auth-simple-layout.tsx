import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#f3f3f3] p-6 font-sans text-[#1b1b1b] md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <Link href={route('home')} className="text-center">
                        <span className="text-3xl font-black tracking-tighter text-[#e4006c] uppercase italic">VOTE! SHOWDOWN</span>
                    </Link>

                    <div className="rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:p-8">
                        <div className="mb-6 space-y-1 text-center">
                            <h1 className="text-2xl font-black uppercase">{title}</h1>
                            {description && <p className="font-mono text-xs font-bold tracking-wide text-zinc-500 uppercase">{description}</p>}
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
