import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/auth/dal";
import { listAdminUsersAdmin } from "@/lib/data/admin/adminUsers";
import AdminUserRoleForm from "@/components/admin/AdminUserRoleForm";

export const metadata: Metadata = { title: "Admin accounts" };

export default async function AdminAccountsPage() {
  await requireAdminRole();
  const users = await listAdminUsersAdmin();
  users.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Admin accounts</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Grant staff or admin access to the management system. Admin-only.
        </p>
      </div>

      <AdminUserRoleForm />

      <div className="mt-6 overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.uid}>
                <td className="px-4 py-3 text-ink">{user.email ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted capitalize">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
