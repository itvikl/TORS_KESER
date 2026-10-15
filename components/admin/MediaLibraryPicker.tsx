"use client";

import { useEffect } from "react";
import MediaLibraryBrowser from "@/components/admin/MediaLibraryBrowser";

/**
 * Modal around MediaLibraryBrowser — opened from ImageUploadButton's
 * "Choose from library", so every image field in the admin gets reuse
 * (browse by category, or upload straight into one) without per-form wiring.
 */
export default function MediaLibraryPicker({
  multiple,
  onSelect,
  onClose,
}: {
  multiple: boolean;
  onSelect: (urls: string[]) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image library"
        className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold text-ink">Image library</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-ink-muted hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <MediaLibraryBrowser
          mode="pick"
          multiple={multiple}
          onPick={(urls) => {
            onSelect(urls);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
