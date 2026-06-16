# Module - User Management (Admin only) `[planned]`

> Vertical slice for D16. Cross-refs: auth [`../06-auth-and-roles.md`](../06-auth-and-roles.md), backend [`../04-backend.md`](../04-backend.md), database [`../03-database.md`](../03-database.md).

## Responsibility

Give admins a surface to list, create, edit, and delete user accounts and assign roles (`admin` / `creator` — voters are not accounts). Entirely admin-gated; non-admins never see or reach it.

## Database

Uses the existing `users` table (no schema change). Privilege fields (`role`, `is_guest`, `is_demo`) are set **only** through this audited path — see the related security finding about `User::$fillable`.

## Backend

- `Admin\UserController` — thin: `index`, `create`, `store`, `edit`, `update`, `destroy`.
- `StoreUserRequest` / `UpdateUserRequest` — validate `name`, `email` (unique, ignoring self on update), `password` (required on create, optional on update), and `role` constrained to the `UserRole` enum.
- `UserPolicy` — every action admin-only; registered in the auth service provider.
- Routes: resourceful `admin/users` under `->middleware(['auth','verified','role:admin'])`.

## Authorization & safeguards

- `role:admin` middleware **and** `UserPolicy` (defence in depth).
- **No self-lockout:** an admin cannot delete their own account or demote themselves out of `admin`.
- **Last-admin guard:** the final remaining admin cannot be deleted or demoted.
- `role` is assigned explicitly by a trusted admin here; it is still validated server-side against the enum, never mass-assigned from arbitrary input.

## Frontend

- `pages/admin/users/index.tsx` — brutalist table of users (name, email, role badge, guest flag), with create/edit/delete actions.
- `pages/admin/users/create.tsx` and `edit.tsx` — shared form.
- Delete uses a confirmation modal + flash/toast (no `alert()`).
- Sidebar link rendered only when the current user is an admin.

## Acceptance Criteria

- [ ] Non-admins receive 403 on every `admin/users` route.
- [ ] Admin can list, create, edit, and delete users.
- [ ] Role is validated against `UserRole`; invalid roles rejected.
- [ ] Self-deletion and self-demotion are blocked.
- [ ] The last admin cannot be removed or demoted.
- [ ] Privilege fields are set only via this path (mass-assignment finding closed).
- [ ] Feedback uses flash/toast; design follows the brutalist reference.
