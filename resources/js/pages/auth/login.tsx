import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import AuthLayout from '@/layouts/auth-layout';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

const inputClass =
    'h-12 w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 font-bold focus:border-[#e4006c] focus:outline-none';
const labelClass = 'mb-1.5 block font-mono text-xs font-bold uppercase';

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <AuthLayout title="Log in" description="Enter your email and password">
            <Head title="Log in" />

            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div>
                    <label htmlFor="email" className={labelClass}>Email address</label>
                    <input id="email" type="email" required autoFocus autoComplete="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="email@example.com" className={inputClass} />
                    <InputError message={errors.email} className="mt-1" />
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className={labelClass}>Password</label>
                        {canResetPassword && (
                            <Link href={route('password.request')} className="font-mono text-[11px] font-bold text-[#006875] uppercase hover:text-[#e4006c]">
                                Forgot?
                            </Link>
                        )}
                    </div>
                    <input id="password" type="password" required autoComplete="current-password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="Password" className={inputClass} />
                    <InputError message={errors.password} className="mt-1" />
                </div>

                <label className="flex cursor-pointer items-center gap-3 font-mono text-xs font-bold uppercase">
                    <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="h-5 w-5 accent-[#e4006c]" />
                    Remember me
                </label>

                <button type="submit" disabled={processing} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[#1b1b1b] bg-[#e4006c] py-3.5 font-mono text-sm font-black tracking-wider text-white uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-60">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Log in
                </button>

                <div className="text-center font-mono text-xs font-bold text-zinc-500 uppercase">
                    No account?{' '}
                    <Link href={route('register')} className="text-[#e4006c] hover:underline">Sign up</Link>
                </div>
            </form>

            {status && <div className="mt-4 rounded-lg border-[2px] border-emerald-500 bg-emerald-100 p-2 text-center text-sm font-bold text-emerald-800">{status}</div>}
        </AuthLayout>
    );
}
