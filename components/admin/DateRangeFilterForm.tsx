import Link from "next/link";
import { isDateRangeActive, type DateRangeFilter } from "@/lib/dateRangeFilter";

const dateInputClass =
  "rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-navy";

/** Plain GET form — the filter lives in the URL, so it survives refresh and feeds export links. */
export default function DateRangeFilterForm({
  filter,
  clearHref,
  fromLabel = "From",
}: {
  filter: DateRangeFilter;
  clearHref: string;
  fromLabel?: string;
}) {
  return (
    <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
      <label className="text-sm font-medium text-ink">
        <span className="mb-1.5 block">{fromLabel}</span>
        <input type="date" name="from" defaultValue={filter.from} className={dateInputClass} />
      </label>
      <label className="text-sm font-medium text-ink">
        <span className="mb-1.5 block">To</span>
        <input type="date" name="to" defaultValue={filter.to} className={dateInputClass} />
      </label>
      <button
        type="submit"
        className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand-warm"
      >
        Filter
      </button>
      {isDateRangeActive(filter) && (
        <Link href={clearHref} className="py-2 text-sm font-medium text-ink-muted hover:text-ink">
          Clear
        </Link>
      )}
    </form>
  );
}
