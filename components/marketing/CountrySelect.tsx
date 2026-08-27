"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { CountryOption } from "@/lib/data/tours";

const AVAILABILITY_LABEL = {
  available: null,
  sold_out: "Sold out",
  unavailable: "Unavailable",
} as const;

/** True on touch/no-hover devices, where there's no mouse-out to close a menu with. */
function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none)").matches;
}

/**
 * Country dropdown — closed control looks like a select; open menu supports
 * either multiple checks or a single choice (closing on pick) without
 * becoming a native listbox. Portaled to document.body so it is not clipped
 * by the next section.
 */
export default function CountrySelect({
  countries,
  value = [],
  onChange,
  multiple = true,
  disabled = false,
  icon,
  label = "Where do you want to travel?",
  hideLabel = false,
}: {
  countries: CountryOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  label?: string;
  hideLabel?: boolean;
}) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const selected = new Set(value);
  const summary =
    value.length === 0 ? "Choose destination" : value.join(", ");
  // Available destinations first, sold-out/unavailable ones pushed to the
  // bottom rather than interleaved alphabetically.
  const sortedCountries = [...countries].sort(
    (a, b) =>
      Number(a.availability !== "available") -
      Number(b.availability !== "available")
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function place() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const width = Math.max(rect.width, 280);
      const centered = rect.left + rect.width / 2 - width / 2;
      const left = Math.min(
        Math.max(centered, 12),
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

  // The trigger and the portaled menu aren't DOM-nested, so a plain
  // mouseleave on either would fire while the pointer is just moving from
  // one to the other. A short delay (cancelled by entering the other one)
  // closes on genuine mouse-out without breaking that hand-off.
  function scheduleClose() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 200);
  }

  function cancelClose() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  function toggleCountry(name: string, disabled: boolean) {
    if (disabled) return;
    if (!multiple) {
      onChange?.([name]);
      // No hover on touch devices, so there's no mouse-out to close this —
      // close right on choose instead. Desktop keeps it open (closes on
      // mouse-out/outside click) so a mouse user can glance at the list.
      if (isCoarsePointer()) setOpen(false);
      return;
    }
    const next = selected.has(name)
      ? value.filter((country) => country !== name)
      : [...value, name];
    onChange?.(next);
  }

  function clearSelection() {
    onChange?.([]);
    if (!multiple && isCoarsePointer()) setOpen(false);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-multiselectable={multiple}
            aria-labelledby={`${listId}-label`}
            style={menuStyle}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="rounded-2xl border border-[var(--color-border-ice-strong)] bg-[var(--color-popover-bg)] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
          >
            <button
              type="button"
              role="option"
              aria-selected={value.length === 0}
              onClick={clearSelection}
              className={[
                "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition-colors",
                value.length === 0
                  ? "bg-[var(--color-surface-hover-a)] text-[var(--color-ice)]"
                  : "text-[var(--color-mist)] hover:bg-[var(--color-surface-hover-a)]",
              ].join(" ")}
            >
              <span className="font-medium">Choose destination</span>
            </button>

            {sortedCountries.map(({ name, availability }) => {
              const tag = AVAILABILITY_LABEL[availability];
              const disabled = availability !== "available";
              const isSelected = selected.has(name);

              return (
                <div key={name}>
                  <div className="mx-3 border-t border-[var(--color-border-hairline)]" aria-hidden="true" />
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={disabled || undefined}
                    disabled={disabled}
                    onClick={() => toggleCountry(name, disabled)}
                    className={[
                      "mt-0.5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition-colors",
                      disabled
                        ? "cursor-not-allowed text-[var(--color-slate)]/55"
                        : isSelected
                          ? "bg-[var(--color-surface-hover-a)] text-[var(--color-ice)]"
                          : "text-[var(--color-mist)] hover:bg-[var(--color-surface-hover-a)]",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-4 w-4 shrink-0 items-center justify-center border",
                        multiple ? "rounded" : "rounded-full",
                        isSelected
                          ? "border-[var(--color-ice)] bg-[var(--color-ice)] text-[var(--color-ice-ink)]"
                          : "border-[var(--color-border-ice-strong)] bg-transparent",
                      ].join(" ")}
                    >
                      {isSelected && multiple ? (
                        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2.5 6.5 5 9l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : isSelected ? (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{name}</span>
                      {tag ? (
                        <span className="mt-0.5 inline-block rounded-full border border-[var(--color-border-hairline)] bg-[var(--color-surface-hover-a)] px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-[var(--color-slate)]">
                          {tag}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div
      className="mx-auto flex min-w-0 max-w-[15rem] items-center gap-2.5"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      {icon ? (
        <span aria-hidden="true" className="shrink-0 text-[var(--color-ice)]">
          {icon}
        </span>
      ) : null}
      <div className="relative min-w-0 flex-1">
        <label
          id={`${listId}-label`}
          className={
            hideLabel
              ? "sr-only"
              : "block text-[10px] font-bold uppercase tracking-widest text-[var(--color-slate)]"
          }
        >
          {label}
        </label>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          title={summary}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onTriggerKeyDown}
          className={[
            "flex w-full min-w-0 items-center gap-1.5 bg-transparent p-0 text-left text-[15px] font-medium text-[var(--color-mist)] outline-none focus-visible:outline-none disabled:cursor-not-allowed",
            hideLabel ? "" : "mt-0.5",
          ].join(" ")}
        >
          <span className="block min-w-0 truncate">{summary}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`h-4 w-4 shrink-0 text-[var(--color-ice)] transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {menu}
      </div>
    </div>
  );
}
