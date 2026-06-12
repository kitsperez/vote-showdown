import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface QrShareProps {
    /** Absolute public poll URL (the shareable / scan-to-vote link). */
    url: string;
    size?: number;
}

/**
 * Inline scan-to-vote card (NOT a modal). Shows the QR + the shareable link with a copy
 * button. Used on the backend poll page and on the side of the public guest page.
 */
export function QrShare({ url, size = 160 }: QrShareProps) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable — link is shown below for manual copy
        }
    };

    return (
        <div className="rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-5 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-1 text-lg font-black tracking-tighter text-[#e4006c] uppercase italic">Scan to vote! ⚡</h3>
            <p className="mb-4 font-mono text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Point a phone camera here</p>

            <div className="mx-auto mb-4 w-fit rounded-xl border-[3px] border-[#1b1b1b] bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <QRCodeSVG value={url} size={size} bgColor="#ffffff" fgColor="#1b1b1b" level="M" />
            </div>

            <button
                onClick={copy}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[#1b1b1b] bg-[#ffe170] px-4 py-2.5 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
            >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy share link'}
            </button>
            <p className="mt-2 truncate font-mono text-[10px] text-zinc-400">{url}</p>
        </div>
    );
}
