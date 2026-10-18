"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DeleteResult } from "@/lib/actions/deletions";
import { AdminIcon } from "@/components/admin/IconAction";

/**
 * Permanent-delete button for admin edit pages: asks to confirm, runs the
 * (pre-bound) server action, then goes back to the list. Pages render it
 * only for the Admin role; the actions check that again on the server.
 */
export default function DeleteButton({
  action,
  what,
  redirectTo,
}: {
  action: () => Promise<DeleteResult>;
  /** Shown in the confirmation, e.g. "this tour". */
  what: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const result = await action().catch(
      (): DeleteResult => ({ ok: false, error: "Couldn't delete — try again." })
    );
    if (!result.ok) {
      setError(result.error);
      setDeleting(false);
      setConfirming(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <span className="inline-flex flex-wrap items-center justify-end gap-3 rounded-lg border border-terracotta/30 bg-terracotta/5 px-3 py-2 text-sm">
          <span className="text-ink">Delete {what} permanently? This can&apos;t be undone.</span>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="font-semibold text-terracotta-dark hover:underline disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => setConfirming(false)}
            className="text-ink-muted hover:underline"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-semibold text-terracotta-dark transition-colors hover:bg-terracotta/5"
        >
          <AdminIcon name="trash" className="h-4 w-4" />
          Delete
        </button>
      )}
      {error && <p className="max-w-sm text-right text-xs text-terracotta-dark">{error}</p>}
    </div>
  );
}
