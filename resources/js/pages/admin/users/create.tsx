import { Head } from '@inertiajs/react';
import { UserForm } from '@/components/showdown/user-form';
import ShowdownLayout from '@/layouts/showdown-layout';

interface CreateProps {
    roles: { value: string; label: string }[];
}

export default function UsersCreate({ roles }: CreateProps) {
    return (
        <ShowdownLayout title="New User" subtitle="Add an Admin, Poll Creator, or Voter">
            <Head title="New User" />
            <UserForm
                method="post"
                submitUrl={route('admin.users.store')}
                submitLabel="Create user"
                roles={roles}
                initial={{ name: '', email: '', role: roles[0]?.value ?? 'creator', password: '', password_confirmation: '' }}
            />
        </ShowdownLayout>
    );
}
