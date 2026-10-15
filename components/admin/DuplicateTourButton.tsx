"use client";

import { useState, useTransition } from "react";
import { duplicateTour } from "@/lib/actions/tours";

/** Copies the tour into a new draft and navigates to its editor (the action redirects). */
export default function DuplicateTourButton({
  tourId,
  variant = "button",
}: {
  tourId: string;
  variant?: "button" | "link";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const className =
    variant === "link"
      ? "text-sm font-medium text-ink-muted hover:text-ink disabled:opacity-60"
      : "shrink-0 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand-warm disabled:opacity-60";

  return (
    <>
      <button
        type="button"
        disabled={pending}
        title="Create a draft copy of this tour (without departure dates)"
        onClick={() =>
          startTransition(async () => {
            const result = await duplicateTour(tourId);
            if (result && !result.ok) setError(result.error);
          })
        }
        className={className}
      >
        {pending ? "Duplicating…" : "Duplicate"}
      </button>
      {error && <span className="text-xs font-medium text-terracotta-dark">{error}</span>}
    </>
  );
}
