import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import ShowdownLayout from '@/layouts/showdown-layout';
import { type SharedData } from '@/types';

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <ShowdownLayout title="Edit Profile" subtitle="Update your name and email address">
            <Head title="Edit Profile" />

            <div className="flex flex-col gap-8 p-6 md:p-10">
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href={route('profile.edit')}
                        className="rounded-xl border-[3px] border-[#1b1b1b] bg-[#00e3fd] px-4 py-2 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    >
                        Profile
                    </Link>
                    <Link
                        href={route('password.edit')}
                        className="rounded-xl border-[3px] border-[#1b1b1b] bg-white px-4 py-2 font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                        Password
                    </Link>
                </div>

                <form onSubmit={submit} className="max-w-2xl rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-8">
                    <div className="grid gap-6">
                        <div>
                            <label htmlFor="name" className="mb-2 block font-mono text-xs font-bold uppercase">
                                Name
                            </label>
                            <input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Full name"
                                className="h-12 w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 font-bold focus:border-[#e4006c] focus:outline-none"
                            />
                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div>
                            <label htmlFor="email" className="mb-2 block font-mono text-xs font-bold uppercase">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Email address"
                                className="h-12 w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 font-bold focus:border-[#e4006c] focus:outline-none"
                            />
                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div className="rounded-xl border-[3px] border-[#1b1b1b] bg-[#ffe170] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-mono text-xs font-bold uppercase">Email not verified</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-zinc-700">Resend verification email?</p>
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="font-mono text-xs font-black text-[#e4006c] uppercase underline"
                                    >
                                        Send link
                                    </Link>
                                </div>
                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-bold text-emerald-700">Verification link sent.</div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer rounded-xl border-[3px] border-[#1b1b1b] bg-[#e4006c] px-6 py-3 font-mono text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-50"
                            >
                                Save
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

                <div className="max-w-2xl">
                    <DeleteUser />
                </div>
            </div>
        </ShowdownLayout>
    );
}
