import { Head } from '@inertiajs/react';
import { PollForm } from '@/components/showdown/poll-form';
import ShowdownLayout from '@/layouts/showdown-layout';
import type { Poll } from '@/types/models';

export default function PollsEdit({ poll, hasVotes }: { poll: Poll; hasVotes: boolean }) {
    // datetime-local wants "YYYY-MM-DDTHH:mm" (local-ish). Slice the ISO string.
    const deadlineLocal = poll.deadlineAt ? poll.deadlineAt.slice(0, 16) : '';

    return (
        <ShowdownLayout title="Edit Poll" subtitle="Tweak the showdown setup">
            <Head title={`Edit · ${poll.title}`} />
            <PollForm
                method="put"
                submitUrl={route('polls.update', poll.id)}
                submitLabel="Save changes"
                lockOptionStructure={hasVotes}
                initial={{
                    title: poll.title,
                    description: poll.description ?? '',
                    allow_multiple: poll.allowMultiple,
                    access_password: '',
                    end_mode: poll.endMode,
                    duration_seconds: poll.durationSeconds ?? 120,
                    deadline_at: deadlineLocal,
                    options: poll.options.map((o) => ({ id: o.id, label: o.label, icon: o.icon ?? '', image: null, imageUrl: o.imageUrl })),
                }}
            />
        </ShowdownLayout>
    );
}
