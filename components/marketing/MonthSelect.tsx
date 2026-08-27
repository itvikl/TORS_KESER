"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type MonthOption = { value: string; label: string };

/** The next 12 calendar months starting this month, as "YYYY-MM" values. */
export function getNextTwelveMonths(): MonthOption[] {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() + i, 1));
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { value, label: formatter.format(d) };
  });
}

/**
 * Multi-select month dropdown, covering the next 12 months — same
 * interaction model as CountrySelect. Portaled to document.body so it is
 * not clipped by the next section.
 */
export default function MonthSelect({
  value = [],
  onChange,
  onClose,
  disabled = false,
  icon,
  label = "When do you want to travel?",
  hideLabel = false,
}: {
  value?: string[];
  onChange?: (value: string[]) => void;
  /** Fires once, when the menu transitions from open to closed (outside click, Escape, or the trigger). */
  onClose?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  label?: string;
  hideLabel?: boolean;
}) {
  const months = useMemo(() => getNextTwelveMonths(), []);
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const wasOpenRef = useRef(false);

  const selected = new Set(value);
  const summary =
    value.length === 0
      ? "Choose date"
      : months
          .filter((m) => selected.has(m.value))
          .map((m) => m.label)
          .join(", ");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (wasOpenRef.current && !open) onClose?.();
    wasOpenRef.current = open;
  }, [open, onClose]);

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

  function toggleMonth(monthValue: string) {
    const next = selected.has(monthValue)
      ? value.filter((m) => m !== monthValue)
      : [...value, monthValue];
    onChange?.(next);
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
            aria-multiselectable="true"
            aria-labelledby={`${listId}-label`}
            style={menuStyle}
            className="rounded-2xl border border-[var(--color-border-ice-strong)] bg-[var(--color-popover-bg)] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
          >
            <button
              type="button"
              role="option"
              aria-selected={value.length === 0}
              onClick={() => onChange?.([])}
              className={[
                "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition-colors",
                value.length === 0
                  ? "bg-[var(--color-surface-hover-a)] text-[var(--color-ice)]"
                  : "text-[var(--color-mist)] hover:bg-[var(--color-surface-hover-a)]",
              ].join(" ")}
            >
              <span className="font-medium">Choose date</span>
            </button>

            {months.map(({ value: monthValue, label }) => {
              const isSelected = selected.has(monthValue);

              return (
                <div key={monthValue}>
                  <div className="mx-3 border-t border-[var(--color-border-hairline)]" aria-hidden="true" />
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleMonth(monthValue)}
                    className={[
                      "mt-0.5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition-colors",
                      isSelected
                        ? "bg-[var(--color-surface-hover-a)] text-[var(--color-ice)]"
                        : "text-[var(--color-mist)] hover:bg-[var(--color-surface-hover-a)]",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-[var(--color-ice)] bg-[var(--color-ice)] text-[var(--color-ice-ink)]"
                          : "border-[var(--color-border-ice-strong)] bg-transparent",
                      ].join(" ")}
                    >
                      {isSelected ? (
                        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2.5 6.5 5 9l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 font-medium">{label}</span>
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="mx-auto flex min-w-0 max-w-[15rem] items-center gap-2.5">
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
