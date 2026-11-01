"use client";

import { useEffect, useState } from "react";
import TourPageView from "@/components/marketing/TourPageView";
import type { Departure, Staff, Tour } from "@/lib/types";
import type { TourPageCopy } from "@/lib/siteCopy";

/**
 * Bare iframe target for the admin tour editor's live preview (PRD FR-25).
 * Rendered inside an <iframe> so the Desktop/Tablet/Mobile toggle can
 * resize the iframe itself — TourPageView's Tailwind responsive classes
 * (sm:/md:/lg:) key off the iframe's real viewport width, which a CSS
 * transform/width on a same-page wrapper div cannot reproduce.
 *
 * The parent editor (already behind /admin auth) pushes form state in via
 * postMessage; only the shared wording comes from the server (page.tsx).
 */
export default function PreviewFrameClient({ copy }: { copy: TourPageCopy }) {
  const [payload, setPayload] = useState<{
    tour: Tour;
    departures: Departure[];
    guides: Staff[];
  } | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "tour-preview-update") return;
      setPayload({
        tour: event.data.tour,
        departures: event.data.departures ?? [],
        guides: event.data.guides ?? [],
      });
    }

    window.addEventListener("message", onMessage);
    // Tell the parent we're ready to receive the first payload.
    window.parent.postMessage({ type: "tour-preview-frame-ready" }, window.location.origin);

    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] text-sm text-[#a0b4c4]">
        Loading preview…
      </div>
    );
  }

  return (
    <TourPageView
      tour={payload.tour}
      departures={payload.departures}
      guides={payload.guides}
      previewMode
      copy={copy}
    />
  );
}
