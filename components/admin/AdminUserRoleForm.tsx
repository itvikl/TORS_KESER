"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/lib/actions/adminUsers";
import type { UserRole } from "@/lib/types";

export default function AdminUserRoleForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Extract<UserRole, "staff" | "admin">>("staff");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const result = await updateUserRole({ email, role });
    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      return;
    }

    setEmail("");
    setSaving(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-xl border border-line bg-white p-5"
    >
      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="email">
          Email
        </label>
        <p className="mt-0.5 text-xs text-ink-muted">Must already have signed in once.</p>
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
        className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
      >
        {saving ? "Saving…" : "Grant access"}
      </button>
    </form>
  );
}
