import Link from "next/link";
import type { Metadata } from "next";
import { getPastDeparturesAdmin, parseHistoryDateFilter } from "@/lib/data/admin/history";

export const metadata: Metadata = { title: "History" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const dateInputClass =
  "rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-navy";

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
}) {
  const filter = parseHistoryDateFilter(await searchParams);
  const rows = await getPastDeparturesAdmin(filter);
  const isFiltered = Boolean(filter.from || filter.to);

  const exportParams = new URLSearchParams();
  if (filter.from) exportParams.set("from", filter.from);
  if (filter.to) exportParams.set("to", filter.to);
  const exportHref = `/admin/history/export${exportParams.size ? `?${exportParams}` : ""}`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">History</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} past departure{rows.length === 1 ? "" : "s"}
            {isFiltered ? " in the selected range" : ""}
          </p>
        </div>
        <a
          href={exportHref}
          className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          Export to Excel
        </a>
      </div>

      {/* Plain GET form — the filter lives in the URL, so it survives refresh and feeds the export link. */}
      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
        <label className="text-sm font-medium text-ink">
          <span className="mb-1.5 block">Departed from</span>
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
        {isFiltered && (
          <Link href="/admin/history" className="py-2 text-sm font-medium text-ink-muted hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          {isFiltered ? "No past departures in this date range." : "No past departures yet."}
        </p>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Registrants</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ departure, tour, registrantCount }) => (
                <tr key={departure.departureId} className="align-middle">
                  <td className="px-4 py-3 font-semibold text-ink">{tour?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {formatDate(departure.startDate)} – {formatDate(departure.endDate)}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{registrantCount}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/history/${departure.departureId}`}
                      className="text-sm font-medium text-navy hover:text-navy-light"
                    >
                      View registrants
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
