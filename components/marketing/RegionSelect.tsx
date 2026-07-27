"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import type { RegionOption } from "@/lib/data/tours";

const AVAILABILITY_LABEL = {
  available: null,
  sold_out: "Sold out",
  unavailable: "Not available in the near future",
} as const;

/**
 * Multi-select region dropdown — closed control looks like a select;
 * open menu supports multiple checks without becoming a listbox.
 * Portaled to document.body so it is not clipped by the next section.
 */
export default function RegionSelect({
  regions,
  value = [],
  onChange,
}: {
  regions: RegionOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
}) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const selected = new Set(value);
  const summary =
    value.length === 0 ? "Any destination" : value.join(", ");

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function place() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const width = Math.max(rect.width, 280);
      const left = Math.min(
        rect.left,
        Math.max(12, window.innerWidth - width - 12)
      );
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 10,
        left,
        width,
        zIndex: 9999,
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleRegion(name: string, disabled: boolean) {
    if (disabled) return;
    const next = selected.has(name)
      ? value.filter((region) => region !== name)
      : [...value, name];
    onChange?.(next);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  // Hidden inputs so the form can still read selected regions on submit
  const hiddenInputs = value.map((region) => (
    <input key={region} type="hidden" name="region" value={region} />
  ));

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={`${listId}-label`}
            style={menuStyle}
            className="rounded-2xl border border-[rgba(125,211,252,0.15)] bg-[#141c2e] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
          >
            <button
              type="button"
              role="option"
              aria-selected={value.length === 0}
              onClick={() => onChange?.([])}
              className={[
                "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition-colors",
                value.length === 0
                  ? "bg-white/5 text-[#7dd3fc]"
                  : "text-[#e0e8f0] hover:bg-white/5",
              ].join(" ")}
            >
              <span className="font-medium">Any destination</span>
            </button>

            {regions.map(({ name, availability }) => {
              const tag = AVAILABILITY_LABEL[availability];
              const disabled = availability !== "available";
              const isSelected = selected.has(name);

              return (
                <div key={name}>
                  <div className="mx-3 border-t border-white/10" aria-hidden="true" />
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={disabled || undefined}
                    disabled={disabled}
                    onClick={() => toggleRegion(name, disabled)}
                    className={[
                      "mt-0.5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition-colors",
                      disabled
                        ? "cursor-not-allowed text-[#a0b4c4]/55"
                        : isSelected
                          ? "bg-white/5 text-[#7dd3fc]"
                          : "text-[#e0e8f0] hover:bg-white/5",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-[#7dd3fc] bg-[#7dd3fc] text-[#001f2e]"
                          : "border-white/25 bg-transparent",
                      ].join(" ")}
                    >
                      {isSelected ? (
                        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2.5 6.5 5 9l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 font-medium">{name}</span>
                    {tag ? (
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#a0b4c4]">
                        {tag}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative min-w-0 flex-1">
      {hiddenInputs}
      <label
        id={`${listId}-label`}
        className="block text-[10px] font-bold uppercase tracking-widest text-[#a0b4c4]"
      >
        Where do you want to travel?
      </label>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        title={summary}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className="mt-0.5 flex w-full min-w-0 items-center justify-between gap-3 bg-transparent p-0 text-left text-[15px] font-medium text-[#e0e8f0] outline-none focus-visible:outline-none"
      >
        <span className="block min-w-0 flex-1 truncate">{summary}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-[#7dd3fc] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {menu}
    </div>
  );
}
