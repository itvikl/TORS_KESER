import Link from "next/link";

/**
 * Icon-only row actions for admin tables, with a tooltip on hover and
 * keyboard focus (the label is also the accessible name). Stroke icons drawn
 * inline on a 24px grid — no icon library dependency.
 */

const PATHS = {
  edit: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  calendar: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM16 2v4M8 2v4M4 10h16",
  copy: "M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  archive: "M3 4h18v4H3zM5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6L6 18",
  ban: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
} as const;

export type IconName = keyof typeof PATHS;

const TONES = {
  default: "text-ink-muted hover:bg-sand-warm hover:text-navy",
  danger: "text-ink-muted hover:bg-terracotta/10 hover:text-terracotta-dark",
  success: "text-ink-muted hover:bg-olive/10 hover:text-olive",
} as const;

export function AdminIcon({ name, className = "h-[18px] w-[18px]" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

function Tooltip({ label }: { label: string }) {
  return (
    <span
      role="presentation"
      className="pointer-events-none absolute right-full top-1/2 z-30 mr-1.5 -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

const BASE =
  "group relative inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:pointer-events-none disabled:opacity-50";

export function IconLink({
  href,
  icon,
  label,
  tone = "default",
  newTab = false,
}: {
  href: string;
  icon: IconName;
  label: string;
  tone?: keyof typeof TONES;
  newTab?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      target={newTab ? "_blank" : undefined}
      className={`${BASE} ${TONES[tone]}`}
    >
      <AdminIcon name={icon} />
      <Tooltip label={label} />
    </Link>
  );
}

export function IconButton({
  icon,
  label,
  onClick,
  tone = "default",
  disabled = false,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  tone?: keyof typeof TONES;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`${BASE} ${TONES[tone]}`}
    >
      <AdminIcon name={icon} />
      <Tooltip label={label} />
    </button>
  );
}
