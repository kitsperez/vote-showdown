import type { FormDataConvertible } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';
import { ImagePlus, PlusCircle, Rocket, Trash2 } from 'lucide-react';

// Brutalist palette cycled per option, mirroring the prototype.
const PALETTE = [
    { color: 'bg-[#e4006c]', badge: 'bg-[#e4006c] text-[#ffffff]' },
    { color: 'bg-[#00e3fd]', badge: 'bg-[#00e3fd] text-[#1b1b1b]' },
    { color: 'bg-[#ffe170]', badge: 'bg-[#ffe170] text-[#1b1b1b]' },
    { color: 'bg-[#9cf0ff]', badge: 'bg-[#9cf0ff] text-[#001f24]' },
    { color: 'bg-[#ffb1c3]', badge: 'bg-[#ffb1c3] text-[#3f0019]' },
];

export interface OptionInput {
    id?: number;
    label: string;
    icon: string;
    image: File | null;
    imageUrl?: string | null;
    // Satisfy Inertia's useForm FormDataType constraint (index signature).
    [key: string]: FormDataConvertible;
}

export interface PollFormValues {
    title: string;
    description: string;
    allow_multiple: boolean;
    access_password: string;
    end_mode: 'duration' | 'deadline';
    duration_seconds: number;
    deadline_at: string;
    launch?: boolean;
    options: OptionInput[];
}

interface PollFormProps {
    initial: PollFormValues;
    submitUrl: string;
    method?: 'post' | 'put';
    submitLabel: string;
    /**
     * When the poll already has votes, existing options can't be removed (that would orphan
     * their votes) — but new options may still be added.
     */
    protectExistingOptions?: boolean;
}

export function PollForm({ initial, submitUrl, method = 'post', submitLabel, protectExistingOptions = false }: PollFormProps) {
    const { data, setData, post, processing, errors, transform } = useForm({
        ...(method === 'put' ? { _method: 'put' as const } : {}),
        ...initial,
    });

    const patchOption = (i: number, patch: Partial<OptionInput>) =>
        setData('options', data.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
    const addOption = () => data.options.length < 10 && setData('options', [...data.options, { label: '', icon: '', image: null }]);
    // Existing (persisted) options stay put once votes exist; only freshly-added ones (no id) can be removed.
    const canRemove = (opt: OptionInput) => data.options.length > 2 && (!protectExistingOptions || !opt.id);
    const removeOption = (i: number) => {
        if (!canRemove(data.options[i])) return;
        setData('options', data.options.filter((_, idx) => idx !== i));
    };

    transform((d) => ({
        ...d,
        options: d.options
            .filter((o) => o.label.trim() !== '')
            .map((o, i) => ({
                ...(o.id ? { id: o.id } : {}),
                label: o.label,
                color_class: PALETTE[i % PALETTE.length].color,
                badge_color_class: PALETTE[i % PALETTE.length].badge,
                icon: o.icon || null,
                ...(o.image ? { image: o.image } : {}),
            })),
    }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(submitUrl, { forceFormData: true });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-6 p-6 md:p-10">
            <div className="max-w-3xl rounded-2xl border-[3px] border-[#1b1b1b] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-8">
                {/* Title */}
                <label className="mb-2 block font-mono text-xs font-bold uppercase">Showdown Question</label>
                <input
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="e.g. Best Pizza Topping?"
                    className="w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 py-3 font-bold focus:border-[#e4006c] focus:outline-none"
                />
                {errors.title && <p className="mt-1 font-mono text-xs font-bold text-[#e4006c]">{errors.title}</p>}

                {/* Description */}
                <label className="mt-6 mb-2 block font-mono text-xs font-bold uppercase">Description (optional)</label>
                <textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={2}
                    placeholder="Settle the debate once and for all..."
                    className="w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 py-3 font-medium focus:border-[#e4006c] focus:outline-none"
                />

                {/* Options */}
                <label className="mt-6 mb-2 block font-mono text-xs font-bold uppercase">Options (2–10)</label>
                {protectExistingOptions && (
                    <p className="mb-2 font-mono text-[10px] text-amber-600 uppercase">Votes exist — you can edit and add options, but existing ones can't be removed.</p>
                )}
                <div className="flex flex-col gap-3">
                    {data.options.map((opt, i) => {
                        const imageError = (errors as Record<string, string>)[`options.${i}.image`];
                        return (
                        <div key={opt.id ?? `new-${i}`} className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <label className={`group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-[3px] border-[#1b1b1b] font-mono text-xs font-bold ${PALETTE[i % PALETTE.length].color}`} title="Upload image (JPG/PNG/WebP)">
                                    {opt.image ? (
                                        <img src={URL.createObjectURL(opt.image)} alt="" className="h-full w-full object-cover" />
                                    ) : opt.imageUrl ? (
                                        <img src={opt.imageUrl} alt="" className="h-full w-full object-cover" />
                                    ) : opt.icon ? (
                                        <span className="text-xl leading-none">{opt.icon}</span>
                                    ) : (
                                        String(i + 1).padStart(2, '0')
                                    )}
                                    <span className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
                                        <ImagePlus className="h-4 w-4 text-white" />
                                    </span>
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => patchOption(i, { image: e.target.files?.[0] ?? null })} />
                                </label>
                                <input
                                    value={opt.label}
                                    onChange={(e) => patchOption(i, { label: e.target.value })}
                                    placeholder={`Option ${i + 1}`}
                                    className="min-w-0 flex-1 rounded-xl border-[3px] border-[#1b1b1b] px-4 py-2.5 font-bold focus:border-[#e4006c] focus:outline-none"
                                />
                               
                                {canRemove(opt) && (
                                    <button type="button" onClick={() => removeOption(i)} className="shrink-0 cursor-pointer rounded-lg border-[2px] border-[#1b1b1b] bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200" title="Remove option">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {imageError && <p className="pl-14 font-mono text-xs font-bold text-[#e4006c]">{imageError}</p>}
                        </div>
                        );
                    })}
                </div>
                {errors.options && <p className="mt-1 font-mono text-xs font-bold text-[#e4006c]">{errors.options}</p>}
                {data.options.length < 10 && (
                    <button type="button" onClick={addOption} className="mt-3 flex cursor-pointer items-center gap-2 font-mono text-xs font-bold text-[#006875] uppercase hover:underline">
                        <PlusCircle className="h-4 w-4" /> Add option
                    </button>
                )}

                {/* End mode */}
                <div className="mt-6">
                    <label className="mb-2 block font-mono text-xs font-bold uppercase">How does it end?</label>
                    <div className="mb-3 flex gap-2">
                        {(['duration', 'deadline'] as const).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setData('end_mode', mode)}
                                className={`flex-1 cursor-pointer rounded-xl border-[3px] border-[#1b1b1b] px-4 py-2.5 font-mono text-xs font-bold uppercase transition-all ${
                                    data.end_mode === mode ? 'bg-[#00e3fd] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:-translate-y-0.5'
                                }`}
                            >
                                {mode === 'duration' ? '⏱ Countdown' : '📅 Deadline date'}
                            </button>
                        ))}
                    </div>

                    {data.end_mode === 'duration' ? (
                        <select
                            value={data.duration_seconds}
                            onChange={(e) => setData('duration_seconds', Number(e.target.value))}
                            className="w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 py-3 font-bold focus:outline-none"
                        >
                            <option value={45}>45 seconds</option>
                            <option value={90}>90 seconds</option>
                            <option value={120}>120 seconds</option>
                            <option value={180}>180 seconds</option>
                        </select>
                    ) : (
                        <input
                            type="datetime-local"
                            value={data.deadline_at}
                            onChange={(e) => setData('deadline_at', e.target.value)}
                            className="w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 py-3 font-bold focus:border-[#e4006c] focus:outline-none"
                        />
                    )}
                    {errors.duration_seconds && <p className="mt-1 font-mono text-xs font-bold text-[#e4006c]">{errors.duration_seconds}</p>}
                    {errors.deadline_at && <p className="mt-1 font-mono text-xs font-bold text-[#e4006c]">{errors.deadline_at}</p>}
                </div>

                {/* Password */}
                <div className="mt-6">
                    <label className="mb-2 block font-mono text-xs font-bold uppercase">Access password (optional)</label>
                    <input
                        type="text"
                        value={data.access_password}
                        onChange={(e) => setData('access_password', e.target.value)}
                        placeholder={method === 'put' ? 'Leave blank to keep current' : 'Leave blank for an open poll'}
                        className="w-full rounded-xl border-[3px] border-[#1b1b1b] px-4 py-3 font-bold focus:border-[#e4006c] focus:outline-none"
                    />
                    <p className="mt-1 font-mono text-[10px] text-zinc-400 uppercase">If set, voters must enter this before voting.</p>
                </div>

                {/* Settings */}
                <div className="mt-6 flex flex-col gap-3">
                    <label className="flex cursor-pointer items-center gap-3 font-mono text-xs font-bold uppercase">
                        <input type="checkbox" checked={data.allow_multiple} onChange={(e) => setData('allow_multiple', e.target.checked)} className="h-5 w-5 accent-[#e4006c]" />
                        Allow multiple choice
                    </label>
                    {method === 'post' && (
                        <label className="flex cursor-pointer items-center gap-3 font-mono text-xs font-bold uppercase">
                            <input type="checkbox" checked={!!data.launch} onChange={(e) => setData('launch', e.target.checked)} className="h-5 w-5 accent-[#e4006c]" />
                            Launch immediately
                        </label>
                    )}
                </div>
            </div>

            <button
                type="submit"
                disabled={processing}
                className="flex w-fit cursor-pointer items-center gap-3 rounded-xl border-[3px] border-[#1b1b1b] bg-[#e4006c] px-8 py-4 font-mono text-sm font-black tracking-wider text-white uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-60"
            >
                <Rocket className="h-5 w-5" /> {submitLabel}
            </button>
        </form>
    );
}
