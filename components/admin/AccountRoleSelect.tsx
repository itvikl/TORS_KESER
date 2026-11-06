"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeAccountRole } from "@/lib/actions/adminUsers";
import { useConfirm, useToast } from "@/components/admin/feedback/AdminFeedbackProvider";
import { ROLE_LABELS, type AdminRole } from "@/lib/auth/roles";

/** Role dropdown on an Admin accounts row; the change applies at once (their session restarts). */
export default function AccountRoleSelect({
  uid,
  email,
  role,
  options,
}: {
  uid: string;
  email: string | null;
  role: AdminRole;
  options: AdminRole[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  async function handleChange(next: AdminRole) {
    if (next === role) return;
    const ok = await confirm({
      title: `Make ${email ?? "this account"} ${ROLE_LABELS[next]}?`,
      description: "They'll be signed out and get the new permissions when they sign in again.",
      confirmLabel: "Change role",
    });
    if (!ok) return;
    setSaving(true);
    const result = await changeAccountRole({ uid, role: next }).catch(() => ({
      ok: false as const,
      error: "Couldn't change the role — try again.",
    }));
    setSaving(false);
    if (!result.ok) {
      toast.error({ title: "Role not changed", description: result.error });
      return;
    }
    toast.success({ title: "Role changed", description: `${email ?? "The account"} is now ${ROLE_LABELS[next]}.` });
    router.refresh();
  }

  return (
    <select
      aria-label={`Role for ${email ?? "this account"}`}
      value={role}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as AdminRole)}
      className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink disabled:opacity-60"
    >
      {options.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}
