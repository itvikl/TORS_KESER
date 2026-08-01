"use client";

import { useEffect, useState } from "react";
import TourPageView from "@/components/marketing/TourPageView";
import type { Departure, Tour } from "@/lib/types";

/**
 * Bare iframe target for the admin tour editor's live preview (PRD FR-25).
 * Rendered inside an <iframe> so the Desktop/Tablet/Mobile toggle can
 * resize the iframe itself — TourPageView's Tailwind responsive classes
 * (sm:/md:/lg:) key off the iframe's real viewport width, which a CSS
 * transform/width on a same-page wrapper div cannot reproduce.
 *
 * No auth check of its own: it fetches nothing — the parent editor
 * (already behind /admin auth) pushes form state in via postMessage. The
 * route still only exists under /admin, so proxy.ts requires a session to
 * load the frame at all.
 */
export default function PreviewFramePage() {
  const [payload, setPayload] = useState<{ tour: Tour; departures: Departure[] } | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "tour-preview-update") return;
      setPayload({ tour: event.data.tour, departures: event.data.departures ?? [] });
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
    <TourPageView tour={payload.tour} departures={payload.departures} previewMode />
  );
}
