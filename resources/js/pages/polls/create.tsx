import { Head } from '@inertiajs/react';
import { PollForm } from '@/components/showdown/poll-form';
import ShowdownLayout from '@/layouts/showdown-layout';

export default function PollsCreate() {
    return (
        <ShowdownLayout title="Poll Creator" subtitle="Build something electrifying!">
            <Head title="Create Poll" />
            <PollForm
                method="post"
                submitUrl={route('polls.store')}
                submitLabel="Create & Launch"
                initial={{
                    title: '',
                    description: '',
                    allow_multiple: false,
                    access_password: '',
                    end_mode: 'duration',
                    duration_seconds: 120,
                    deadline_at: '',
                    launch: true,
                    options: [
                        { label: 'The Flashy Contender', icon: '', image: null },
                        { label: 'The Silent Mastermind', icon: '', image: null },
                        { label: '', icon: '', image: null },
                    ],
                }}
            />
        </ShowdownLayout>
    );
}
