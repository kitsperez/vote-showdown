import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { SharedData } from '@/types';

type Toast = { id: number; type: 'success' | 'error'; message: string };

/**
 * Renders server flash messages as cartoony brutalist toasts — the production
 * replacement for the prototype's alert() calls.
 */
export function FlashToast() {
    const { flash } = usePage<SharedData>().props;
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const next: Toast[] = [];
        if (flash?.success) next.push({ id: Date.now(), type: 'success', message: flash.success });
        if (flash?.error) next.push({ id: Date.now() + 1, type: 'error', message: flash.error });
        if (next.length === 0) return;

        setToasts((prev) => [...prev, ...next]);
        const timer = setTimeout(() => {
            setToasts((prev) => prev.filter((t) => !next.some((n) => n.id === t.id)));
        }, 3500);
        return () => clearTimeout(timer);
    }, [flash?.success, flash?.error]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`animate-bounce rounded-xl border-[3px] border-[#1b1b1b] px-5 py-3 font-mono text-sm font-bold uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                        t.type === 'success' ? 'bg-[#ffe170] text-[#1b1b1b]' : 'bg-[#e4006c] text-white'
                    }`}
                >
                    {t.message}
                </div>
            ))}
        </div>
    );
}
