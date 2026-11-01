"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/feedback/AdminFeedbackProvider";
import { addAdminAccount } from "@/lib/actions/adminUsers";
import type { UserRole } from "@/lib/types";

/**
 * "Add account": creates the login when the email has none yet (password
 * required), otherwise just sets the role on the existing login.
 */
export default function AdminUserRoleForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Extract<UserRole, "staff" | "admin">>("staff");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    let result;
    try {
      result = await addAdminAccount({ email, password, role });
    } catch {
      setSaving(false);
      toast.error({ title: "Save failed", description: "Something went wrong on the server — please try again." });
      return;
    }
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors);
      toast.error({
        title: "Account not saved",
        description: result.errors.email?.[0] ?? result.errors.password?.[0] ?? "Please check the details and try again.",
      });
      return;
    }

    toast.success(
      result.created
        ? {
            title: "Account created",
            description: `Account created for ${email}. Share the password with them — they sign in at /admin/login.`,
            duration: 8000,
          }
        : { title: "Access updated", description: `${email} already had a login — their access is now set to ${role}.` }
    );
    setEmail("");
    setPassword("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-base font-bold text-ink">Add account</h2>
      <p className="mt-0.5 text-xs text-ink-muted">
        New email: creates the login with this password. Existing login: only changes the role
        (password can stay blank).
      </p>
      <div className="mt-4 flex flex-wrap items-start gap-4">
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-64 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          />
          {errors.email && <p className="mt-1 text-xs text-terracotta-dark">{errors.email[0]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="text"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min. 8 characters"
            className="mt-1.5 w-52 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          />
          {errors.password && (
            <p className="mt-1 max-w-52 text-xs text-terracotta-dark">{errors.password[0]}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "staff" | "admin")}
            className="mt-1.5 w-36 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-7 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add account"}
        </button>
      </div>
    </form>
  );
}
