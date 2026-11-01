"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Point = { x: number; y: number };

// The shapes tour photos are cropped to on the public site, so the editor sees what a pick really does.
const PREVIEWS = [
  { label: "Home card", box: "h-32 w-32" },
  { label: "Tour banner", box: "h-28 w-44" },
  { label: "Side tile", box: "h-16 w-44" },
];

/**
 * Pick the important part of a photo. Click or drag on the picture to set the
 * focus point; the photo is then cropped around it everywhere it is shown
 * (cards, the tour banner and its tiles). Untouched photos stay centered.
 */
export default function ImageFocusDialog({
  src,
  value,
  onChange,
  onClose,
}: {
  src: string;
  value?: Point;
  onChange: (point: Point | undefined) => void;
  onClose: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const doneButton = useRef<HTMLButtonElement>(null);
  const point = value ?? { x: 50, y: 50 };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    doneButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function pick(event: React.PointerEvent) {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const clamp = (n: number) => Math.min(100, Math.max(0, n));
    onChange({
      x: clamp(((event.clientX - rect.left) / rect.width) * 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100),
    });
  }

  const position = `${Math.round(point.x)}% ${Math.round(point.y)}%`;

  return createPortal(
    // Below the admin's toasts (z-100) and confirm dialogs (z-110).
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose the important part of the photo"
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-base font-bold text-ink">Choose the important part of the photo</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Click or drag on the photo to mark what must stay in view, such as a face, a building&apos;s top or the
          horizon. The photo is cropped around that spot wherever it is shown.
        </p>

        <div className="mt-4 flex flex-col gap-5 md:flex-row">
          <div className="min-w-0 flex-1">
            <div
              ref={frame}
              className="relative mx-auto w-fit max-w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg"
              onPointerDown={(event) => {
                pick(event);
                // Keeps a drag tracking the pointer outside the photo; not every input device supports capture.
                try {
                  event.currentTarget.setPointerCapture(event.pointerId);
                } catch {
                  /* the click itself already set the point */
                }
              }}
              onPointerMove={(event) => {
                if (event.buttons === 1) pick(event);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin editing aid, not public-facing content */}
              <img src={src} alt="" draggable={false} className="block max-h-[55vh] max-w-full" />
              <span
                aria-hidden="true"
                data-testid="focus-marker"
                className="pointer-events-none absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.45)]"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>
            <p className="mt-2 text-center text-xs text-ink-muted">
              {value ? `Focus set (${position})` : "Not set — the photo is cropped around its center"}
            </p>
          </div>

          <div className="shrink-0 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">How it will look</p>
            {PREVIEWS.map((preview) => (
              <div key={preview.label}>
                <div className={`overflow-hidden rounded-lg bg-black ${preview.box}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin editing aid, not public-facing content */}
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: position }}
                    data-testid="focus-preview"
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-ink-muted">{preview.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onChange(undefined)}
            disabled={!value}
            className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand-warm disabled:opacity-40"
          >
            Reset to center
          </button>
          <button
            ref={doneButton}
            type="button"
            onClick={onClose}
            className="rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
