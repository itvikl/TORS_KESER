"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAdminAccount } from "@/lib/actions/adminUsers";
import { IconButton } from "@/components/admin/IconAction";

/** Row action on Admin accounts — asks to confirm, then removes the login entirely. */
export default function DeleteAdminAccountButton({ uid, email }: { uid: string; email: string | null }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const result = await deleteAdminAccount(uid).catch(() => ({ ok: false, error: "Couldn't delete — try again." }));
    setDeleting(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't delete — try again.");
      setConfirming(false);
      return;
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="inline-flex flex-wrap items-center justify-end gap-2 text-sm">
        <span className="text-ink-muted">Delete {email ?? "this account"}?</span>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="font-semibold text-terracotta-dark hover:underline disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-ink-muted hover:underline">
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end">
      <IconButton icon="trash" label="Delete account" tone="danger" onClick={() => setConfirming(true)} />
      {error && <span className="mt-1 text-xs text-terracotta-dark">{error}</span>}
    </span>
  );
}
