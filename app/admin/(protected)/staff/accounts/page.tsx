import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/auth/dal";
import { getTwoFactorUidsAdmin, listAdminUsersAdmin } from "@/lib/data/admin/adminUsers";
import AdminUserRoleForm from "@/components/admin/AdminUserRoleForm";
import DeleteAdminAccountButton from "@/components/admin/DeleteAdminAccountButton";
import ResetTwoFactorButton from "@/components/admin/ResetTwoFactorButton";
import { isAdmin2faRequired } from "@/lib/auth/mfa";

export const metadata: Metadata = { title: "Admin accounts" };

export default async function AdminAccountsPage() {
  const session = await requireAdminRole();
  const users = await listAdminUsersAdmin();
  users.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
  const twoFactorUids = await getTwoFactorUidsAdmin(users.map((u) => u.uid));
  const required = isAdmin2faRequired();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Admin accounts</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Who can sign in to the management system. Admin-only.
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Two-factor authentication is{" "}
          <strong className="text-ink">{required ? "required" : "optional"}</strong> for every account
          {required
            ? " — accounts with an authenticator app enter its code; everyone else gets a code by email at each sign-in."
            : " — accounts that set up an authenticator app enter its code at every sign-in."}
        </p>
      </div>

      <AdminUserRoleForm />

      <div className="mt-6 overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">2FA</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.uid}>
                <td className="px-4 py-3 text-ink">
                  {user.email ?? "—"}
                  {user.uid === session.uid && <span className="ms-2 text-xs text-ink-muted">(you)</span>}
                </td>
                <td className="px-4 py-3 text-ink-muted capitalize">{user.role}</td>
                <td className="px-4 py-3">
                  {twoFactorUids.has(user.uid) ? (
                    <span className="font-medium text-olive">App</span>
                  ) : required ? (
                    <span className="font-medium text-olive">Email</span>
                  ) : (
                    <span className="text-ink-muted">Off</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.uid !== session.uid && (
                    <span className="inline-flex items-start justify-end gap-1">
                      {twoFactorUids.has(user.uid) && (
                        <ResetTwoFactorButton uid={user.uid} email={user.email} />
                      )}
                      <DeleteAdminAccountButton uid={user.uid} email={user.email} />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
