import InputError from '@/components/input-error';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

import ShowdownLayout from '@/layouts/showdown-layout';

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <ShowdownLayout title="Change Password" subtitle="Use a long, random password to stay secure">
            <Head title="Change Password" />

            <div className="flex flex-col gap-8 p-6 md:p-10">
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href={route('profile.edit')}
                        className="rounded-xl border-[3px] border-[#1b1b1b] bg-white px-4 py-2 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                        Profile
                    </Link>
                    <Link
                        href={route('password.edit')}
                        className="rounded-xl border-[3px] border-[#1b1b1b] bg-[#00e3fd] px-4 py-2 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    >
                        Password
                    </Link>
                </div>

                <form onSubmit={updatePassword} className="max-w-2xl rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-8">
                    <div className="grid gap-6">
                        <div>
                            <label htmlFor="current_password" className="mb-2 block font-mono text-xs font-bold uppercase">
                                Current password
                            </label>
                            <input
                                id="current_password"
                                ref={currentPasswordInput}
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                type="password"
                                autoComplete="current-password"
                                placeholder="Current password"
                                className="h-12 w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 font-bold focus:border-[#e4006c] focus:outline-none"
                            />
                            <InputError className="mt-2" message={errors.current_password} />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-2 block font-mono text-xs font-bold uppercase">
                                New password
                            </label>
                            <input
                                id="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                type="password"
                                autoComplete="new-password"
                                placeholder="New password"
                                className="h-12 w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 font-bold focus:border-[#e4006c] focus:outline-none"
                            />
                            <InputError className="mt-2" message={errors.password} />
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="mb-2 block font-mono text-xs font-bold uppercase">
                                Confirm password
                            </label>
                            <input
                                id="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                type="password"
                                autoComplete="new-password"
                                placeholder="Confirm password"
                                className="h-12 w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 font-bold focus:border-[#e4006c] focus:outline-none"
                            />
                            <InputError className="mt-2" message={errors.password_confirmation} />
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer rounded-xl border-[3px] border-[#1b1b1b] bg-[#e4006c] px-6 py-3 font-mono text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-50"
                            >
                                Save password
                            </button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="font-mono text-xs font-bold text-emerald-700 uppercase">Saved</p>
                            </Transition>
                        </div>
                    </div>
                </form>
            </div>
        </ShowdownLayout>
    );
}
