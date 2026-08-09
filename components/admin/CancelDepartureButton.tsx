"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelDeparture } from "@/lib/actions/departures";

export default function CancelDepartureButton({
  departureId,
  tourId,
  label,
}: {
  departureId: string;
  tourId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="text-ink-muted">Cancel &ldquo;{label}&rdquo;?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await cancelDeparture(departureId, tourId);
              router.refresh();
            })
          }
          className="font-semibold text-terracotta-dark hover:underline disabled:opacity-60"
        >
          {pending ? "Cancelling…" : "Confirm"}
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

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-ink-muted hover:text-terracotta-dark"
    >
      Cancel
    </button>
  );
}
