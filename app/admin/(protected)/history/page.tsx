import Link from "next/link";
import type { Metadata } from "next";
import { getPastDeparturesAdmin, parseHistoryDateFilter } from "@/lib/data/admin/history";
import { AdminIcon } from "@/components/admin/IconAction";
import DateRangeFilterForm from "@/components/admin/DateRangeFilterForm";
import { dateRangeQuery } from "@/lib/dateRangeFilter";

export const metadata: Metadata = { title: "History" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
}) {
  const filter = parseHistoryDateFilter(await searchParams);
  const rows = await getPastDeparturesAdmin(filter);
  const isFiltered = Boolean(filter.from || filter.to);

  const exportHref = `/admin/history/export${dateRangeQuery(filter)}`;

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
          className="inline-flex items-center gap-2 shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          <AdminIcon name="download" className="h-4 w-4" />
          Export to Excel
        </a>
      </div>

      <DateRangeFilterForm filter={filter} clearHref="/admin/history" fromLabel="Departed from" />

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
