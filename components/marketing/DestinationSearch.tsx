const REGIONS = [
  "Asia & Far East",
  "South America",
  "Europe",
  "Africa",
  "North America",
  "South Pacific",
];

/**
 * Destination search widget — a native GET form (works without JS,
 * keyboard-operable by default). Mirrors the "Where do you want to
 * travel?" widget already proven on the existing site (PRD 7.2).
 */
export default function DestinationSearch() {
  return (
    <form
      action="/tours"
      method="get"
      className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-white/90 p-4 shadow-lg sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="region"
          className="block text-xs font-semibold uppercase tracking-wider text-ink-muted"
        >
          Where do you want to travel?
        </label>
        <select
          id="region"
          name="region"
          className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] text-ink"
          defaultValue=""
        >
          <option value="">Any destination</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-terracotta px-6 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-terracotta-dark"
      >
        Search Tours
      </button>
    </form>
  );
}
