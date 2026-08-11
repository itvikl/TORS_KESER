"use client";

export function TextField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
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
  value,
  onChange,
  rows = 3,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  error?: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
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
  saved,
  onSave,
}: {
  saving: boolean;
  saved: boolean;
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
      {saved && <span className="text-sm font-medium text-olive">Saved.</span>}
    </div>
  );
}

/** Wraps the live preview so every page's editor shows it identically: a dark card matching the public site's own background. */
export function PreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-line bg-[#0a0e1a]">
      <p className="border-b border-white/10 bg-[#0f1524] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#7dd3fc]">
        Live preview
      </p>
      <div className="p-6">{children}</div>
    </div>
  );
}
