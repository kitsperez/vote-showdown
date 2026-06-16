<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin-only User Management (D16). Privilege fields (role) are set only through this
 * audited path, never mass-assigned from arbitrary input. Self-lockout and last-admin
 * removal are blocked.
 */
class UserController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->withCount('polls')
            ->orderByDesc('id')
            ->get()
            ->map(fn (User $user) => $this->presentRow($user));

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $this->roleOptions(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('admin/users/create', [
            'roles' => $this->roleOptions(),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $user = new User;
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = $data['password']; // hashed via model cast
        $user->role = UserRole::from($data['role']);
        $user->avatar_text = strtoupper(substr($data['name'], 0, 2));
        $user->save();

        return redirect()->route('admin.users.index')->with('success', "✅ Created {$user->name}.");
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('admin/users/edit', [
            'user' => $this->presentRow($user),
            'roles' => $this->roleOptions(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        $newRole = UserRole::from($data['role']);
        $demotingFromAdmin = $user->role === UserRole::Admin && $newRole !== UserRole::Admin;

        // Guard: an admin cannot strip their own admin role (avoid self-lockout).
        if ($user->id === $request->user()->id && $newRole !== UserRole::Admin) {
            return back()->with('error', 'You cannot remove your own admin role.');
        }

        // Guard: never demote the last remaining admin.
        if ($demotingFromAdmin && $this->isLastAdmin($user)) {
            return back()->with('error', 'This is the last admin — promote someone else first.');
        }

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->role = $newRole;
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }
        $user->save();

        return redirect()->route('admin.users.index')->with('success', "✏️ Updated {$user->name}.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        if ($user->role === UserRole::Admin && $this->isLastAdmin($user)) {
            return back()->with('error', 'You cannot delete the last admin.');
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted.');
    }

    /**
     * Is this the only admin left (no other admin exists)?
     */
    private function isLastAdmin(User $user): bool
    {
        return ! User::query()
            ->where('role', UserRole::Admin)
            ->whereKeyNot($user->id)
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    private function presentRow(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'isGuest' => $user->is_guest,
            'pollsCount' => $user->polls_count ?? 0,
            'avatarText' => $user->avatar_text ?? strtoupper(substr($user->name, 0, 2)),
            'avatarBgColor' => $user->avatar_bg_color ?? 'bg-[#9cf0ff]',
        ];
    }

    /**
     * @return array<int, array{value:string, label:string}>
     */
    private function roleOptions(): array
    {
        return array_map(
            fn (UserRole $role) => ['value' => $role->value, 'label' => $role->label()],
            UserRole::cases(),
        );
    }
}
