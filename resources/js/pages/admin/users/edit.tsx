import { Head } from '@inertiajs/react';
import { UserForm } from '@/components/showdown/user-form';
import ShowdownLayout from '@/layouts/showdown-layout';

interface EditProps {
    user: { id: number; name: string; email: string; role: string };
    roles: { value: string; label: string }[];
}

export default function UsersEdit({ user, roles }: EditProps) {
    return (
        <ShowdownLayout title="Edit User" subtitle={user.name}>
            <Head title={`Edit ${user.name}`} />
            <UserForm
                method="put"
                submitUrl={route('admin.users.update', user.id)}
                submitLabel="Save changes"
                roles={roles}
                passwordOptional
                initial={{ name: user.name, email: user.email, role: user.role, password: '', password_confirmation: '' }}
            />
        </ShowdownLayout>
    );
}
