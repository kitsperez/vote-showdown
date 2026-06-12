import { Head } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { FlashToast } from '@/components/showdown/flash-toast';

/**
 * Sidebar-less shell for the public guest poll page (D8). Anyone with the link sees this —
 * no auth, no admin chrome. Mirrors the prototype's InviteeView framing.
 */
export default function GuestLayout({ title, children }: PropsWithChildren<{ title?: string }>) {
    return (
        <div className="flex min-h-screen flex-col bg-[#f3f3f3] font-sans text-[#1b1b1b]">
            <Head title={title ?? 'Vote'} />

            <header className="flex items-center justify-center border-b-[3px] border-[#1b1b1b] bg-white px-4 py-4">
                <h1 className="text-xl font-black tracking-tighter text-[#e4006c] uppercase italic md:text-2xl">VOTE! SHOWDOWN</h1>
            </header>

            <main className="mx-auto w-full max-w-5xl flex-grow px-4 pb-28 pt-6">{children}</main>

            <FlashToast />
        </div>
    );
}
