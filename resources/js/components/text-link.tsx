import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof Link>;

export default function TextLink({ className = '', children, ...props }: LinkProps) {
    return (
        <Link
            className={cn(
                'font-bold text-[#e4006c] underline decoration-[#e4006c]/40 underline-offset-4 transition-colors duration-200 hover:decoration-[#e4006c]',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
