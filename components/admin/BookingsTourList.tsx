import Link from "next/link";
import type { TourBookingSummary } from "@/lib/data/admin/bookings";

export default function BookingsTourList({ rows }: { rows: TourBookingSummary[] }) {
  return (
    <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-4 py-3">Tour</th>
            <th className="px-4 py-3">Registrants</th>
            <th className="px-4 py-3">Travelers</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.tourId} className="align-middle">
              <td className="px-4 py-3">
                <p className="font-semibold text-ink">{row.tour?.title ?? "Unknown tour"}</p>
                {row.tour && <p className="text-xs text-ink-muted">/{row.tour.slug}</p>}
              </td>
              <td className="px-4 py-3 text-ink-muted">{row.registrantCount}</td>
              <td className="px-4 py-3 text-ink-muted">{row.travelerCount}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/bookings/${row.tourId}`}
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
  );
}
