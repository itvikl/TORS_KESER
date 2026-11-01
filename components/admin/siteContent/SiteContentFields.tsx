"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import UnsavedIndicator from "@/components/admin/feedback/UnsavedIndicator";
import RequiredMark from "@/components/admin/RequiredMark";

export function TextField({
  label,
  required,
  value,
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">
        {label}
        {required && <RequiredMark />}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
      />
      {error && <p className="mt-1 text-xs text-terracotta-dark">{error[0]}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  required,
  value,
  onChange,
  rows = 3,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  error?: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">
        {label}
        {required && <RequiredMark />}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
      />
      {error && <p className="mt-1 text-xs text-terracotta-dark">{error[0]}</p>}
    </div>
  );
}

export function SaveBar({
  saving,
  dirty,
  onSave,
}: {
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {dirty && <UnsavedIndicator />}
    </div>
  );
}

/** Wraps the live preview so every page's editor shows it identically: a dark card matching the public site's own background. */
export function PreviewFrame({ children }: { children: React.ReactNode }) {
  const [full, setFull] = useState(false);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Full screen: lock page scroll behind it, close on Escape, and hand focus
  // back to the button that opened it.
  useEffect(() => {
    if (!full) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", onKey);
    closeButton.current?.focus();
    const opener = openButton.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [full]);

  return (
    <>
      <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-line bg-[#0a0e1a]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0f1524] px-4 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7dd3fc]">Live preview</p>
          <button
            ref={openButton}
            type="button"
            onClick={() => setFull(true)}
            className="rounded-md border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            Full screen ⤢
          </button>
        </div>
        {/* The content renders in one place only — while full screen it lives in the overlay. */}
        {full ? (
          <p className="p-6 text-center text-xs text-[#a0b4c4]">The preview is open full screen.</p>
        ) : (
          <div className="p-6">{children}</div>
        )}
      </div>

      {full &&
        createPortal(
          // Below the admin's toasts (z-100) and confirm dialogs (z-110) so those still show.
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Full screen preview"
            className="fixed inset-0 z-[90] flex flex-col bg-[#0a0e1a]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0f1524] px-4 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7dd3fc]">
                Live preview — full screen
              </p>
              <button
                ref={closeButton}
                type="button"
                onClick={() => setFull(false)}
                className="rounded-md border border-white/20 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/10"
              >
                Close ✕ <span className="ms-1 text-white/50">Esc</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </div>,
          document.body
        )}
    </>
  );
}
