"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAdminAccount } from "@/lib/actions/adminUsers";
import { IconButton } from "@/components/admin/IconAction";
import { useConfirm, useToast } from "@/components/admin/feedback/AdminFeedbackProvider";

/** Row action on Admin accounts — asks to confirm, then removes the login entirely. */
export default function DeleteAdminAccountButton({ uid, email }: { uid: string; email: string | null }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete ${email ?? "this account"}?`,
      description: "The login is removed entirely — they won't be able to sign in to the admin anymore.",
      confirmLabel: "Delete account",
      tone: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    const result = await deleteAdminAccount(uid).catch(() => ({ ok: false, error: "Couldn't delete — try again." }));
    setDeleting(false);
    if (!result.ok) {
      toast.error({ title: "Couldn't delete account", description: result.error ?? "Couldn't delete — try again." });
      return;
    }
    toast.success({ title: "Account deleted", description: `${email ?? "The account"} can no longer sign in.` });
    router.refresh();
  }

  return <IconButton icon="trash" label="Delete account" tone="danger" disabled={deleting} onClick={handleDelete} />;
}
