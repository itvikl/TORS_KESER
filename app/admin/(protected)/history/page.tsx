import Link from "next/link";
import type { Metadata } from "next";
import { getPastDeparturesAdmin } from "@/lib/data/admin/history";

export const metadata: Metadata = { title: "History" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminHistoryPage() {
  const rows = await getPastDeparturesAdmin();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">History</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {rows.length} past departure{rows.length === 1 ? "" : "s"}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No past departures yet.
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
