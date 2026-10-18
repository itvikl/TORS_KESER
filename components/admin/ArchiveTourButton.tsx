"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveTour } from "@/lib/actions/tours";
import { IconButton } from "@/components/admin/IconAction";

/** FR-43: no raw delete in the admin — archiving is the only removal action, and stays reachable/301-able. */
export default function ArchiveTourButton({ tourId, title }: { tourId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="text-ink-muted">Archive &ldquo;{title}&rdquo;?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await archiveTour(tourId);
              router.refresh();
            })
          }
          className="font-semibold text-terracotta-dark hover:underline disabled:opacity-60"
        >
          {pending ? "Archiving…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-ink-muted hover:underline"
        >
          Cancel
        </button>
      </span>
    );
  }

  return <IconButton icon="archive" label="Archive" tone="danger" onClick={() => setConfirming(true)} />;
}
