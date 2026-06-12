import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import AuthLayout from '@/layouts/auth-layout';

const inputClass =
    'h-12 w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 font-bold focus:border-[#e4006c] focus:outline-none disabled:opacity-60';
const labelClass = 'mb-1.5 block font-mono text-xs font-bold uppercase';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <AuthLayout title="Create an account" description="Join the showdown">
            <Head title="Register" />
            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div>
                    <label htmlFor="name" className={labelClass}>Name</label>
                    <input id="name" type="text" required autoFocus autoComplete="name" value={data.name} onChange={(e) => setData('name', e.target.value)} disabled={processing} placeholder="Full name" className={inputClass} />
                    <InputError message={errors.name} className="mt-1" />
                </div>

                <div>
                    <label htmlFor="email" className={labelClass}>Email address</label>
                    <input id="email" type="email" required autoComplete="email" value={data.email} onChange={(e) => setData('email', e.target.value)} disabled={processing} placeholder="email@example.com" className={inputClass} />
                    <InputError message={errors.email} className="mt-1" />
                </div>

                <div>
                    <label htmlFor="password" className={labelClass}>Password</label>
                    <input id="password" type="password" required autoComplete="new-password" value={data.password} onChange={(e) => setData('password', e.target.value)} disabled={processing} placeholder="Password" className={inputClass} />
                    <InputError message={errors.password} className="mt-1" />
                </div>

                <div>
                    <label htmlFor="password_confirmation" className={labelClass}>Confirm password</label>
                    <input id="password_confirmation" type="password" required autoComplete="new-password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} disabled={processing} placeholder="Confirm password" className={inputClass} />
                    <InputError message={errors.password_confirmation} className="mt-1" />
                </div>

                <button type="submit" disabled={processing} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[#1b1b1b] bg-[#e4006c] py-3.5 font-mono text-sm font-black tracking-wider text-white uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-60">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Create account
                </button>

                <div className="text-center font-mono text-xs font-bold text-zinc-500 uppercase">
                    Already have an account?{' '}
                    <Link href={route('login')} className="text-[#e4006c] hover:underline">Log in</Link>
                </div>
            </form>
        </AuthLayout>
    );
}
