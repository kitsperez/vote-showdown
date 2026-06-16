import type { PollOption } from '@/types/models';

/**
 * The square media badge on an option card: uploaded image > icon/emoji > number (D10).
 */
export function OptionBadge({
    option,
    className = '',
    size = 'md',
}: {
    option: Pick<PollOption, 'imageUrl' | 'icon' | 'colorClass' | 'position'>;
    className?: string;
    size?: 'sm' | 'md';
}) {
    const dim = size === 'sm' ? 'h-8 w-8 rounded-md border-[2px]' : 'h-12 w-12 rounded-lg border-[3px]';
    const iconSize = size === 'sm' ? 'text-lg' : 'text-2xl';
    const base = `flex ${dim} shrink-0 items-center justify-center overflow-hidden border-[#1b1b1b] ${className}`;

    if (option.imageUrl) {
        return (
            <span className={`${base} bg-white`}>
                <img src={option.imageUrl} alt="" className="h-full w-full object-cover" />
            </span>
        );
    }

    if (option.icon) {
        return <span className={`${base} ${option.colorClass} ${iconSize} leading-none`}>{option.icon}</span>;
    }

    return <span className={`${base} ${option.colorClass} font-mono font-bold`}>{String(option.position + 1).padStart(2, '0')}</span>;
}
