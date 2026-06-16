import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

interface RoleOption {
    value: string;
    label: string;
}

export interface UserFormValues {
    name: string;
    email: string;
    role: string;
    password: string;
    password_confirmation: string;
}

interface UserFormProps {
    initial: UserFormValues;
    submitUrl: string;
    method?: 'post' | 'put';
    submitLabel: string;
    roles: RoleOption[];
    /** Edit mode: password is optional ("leave blank to keep"). */
    passwordOptional?: boolean;
}

export function UserForm({ initial, submitUrl, method = 'post', submitLabel, roles, passwordOptional = false }: UserFormProps) {
    const { data, setData, post, put, processing, errors } = useForm({ ...initial });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        (method === 'put' ? put : post)(submitUrl, { preserveScroll: true });
    };

    const field = 'w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 py-3 font-bold focus:border-[#e4006c] focus:outline-none';
    const errorText = 'mt-1 font-mono text-xs font-bold text-[#e4006c]';

    return (
        <form onSubmit={submit} className="flex flex-col gap-6 p-6 md:p-10">
            <div className="max-w-xl rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-8">
                <label className="mb-2 block font-mono text-xs font-bold uppercase">Name</label>
                <input value={data.name} onChange={(e) => setData('name', e.target.value)} className={field} />
                {errors.name && <p className={errorText}>{errors.name}</p>}

                <label className="mt-6 mb-2 block font-mono text-xs font-bold uppercase">Email</label>
                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={field} />
                {errors.email && <p className={errorText}>{errors.email}</p>}

                <label className="mt-6 mb-2 block font-mono text-xs font-bold uppercase">Role</label>
                <select value={data.role} onChange={(e) => setData('role', e.target.value)} className={field}>
                    {roles.map((r) => (
                        <option key={r.value} value={r.value}>
                            {r.label}
                        </option>
                    ))}
                </select>
                {errors.role && <p className={errorText}>{errors.role}</p>}

                <label className="mt-6 mb-2 block font-mono text-xs font-bold uppercase">
                    Password {passwordOptional && <span className="text-zinc-400">(leave blank to keep current)</span>}
                </label>
                <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className={field} autoComplete="new-password" />
                {errors.password && <p className={errorText}>{errors.password}</p>}

                <label className="mt-6 mb-2 block font-mono text-xs font-bold uppercase">Confirm password</label>
                <input
                    type="password"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    className={field}
                    autoComplete="new-password"
                />
            </div>

            <button
                type="submit"
                disabled={processing}
                className="flex w-fit cursor-pointer items-center gap-3 rounded-xl border-[3px] border-[#1b1b1b] bg-[#e4006c] px-8 py-4 font-mono text-sm font-black tracking-wider text-white uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-60"
            >
                <Save className="h-5 w-5" /> {submitLabel}
            </button>
        </form>
    );
}
