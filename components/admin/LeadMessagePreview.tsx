"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Leads-table preview of the customer's message: two lines, expandable in place. */
export default function LeadMessagePreview({ message }: { message?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const text = message?.trim();

  // Only offer "Show more" when the clamp actually cuts something off.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  if (!text) return <span className="text-xs text-ink-muted">—</span>;

  return (
    <div className="max-w-72">
      <p
        ref={textRef}
        className={`whitespace-pre-line text-xs leading-relaxed text-ink ${expanded ? "" : "line-clamp-2"}`}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-navy hover:text-navy-light"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
