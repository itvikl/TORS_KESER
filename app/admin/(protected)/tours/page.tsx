import Link from "next/link";
import type { Metadata } from "next";
import { getAllToursAdmin } from "@/lib/data/admin/tours";
import { getDeparturesForTour } from "@/lib/data/tours";
import { formatUsd } from "@/lib/pricing";
import type { Departure, Tour, TourStatus } from "@/lib/types";
import ArchiveTourButton from "@/components/admin/ArchiveTourButton";

export const metadata: Metadata = { title: "Tours" };

/** Plain helper (not the page component) so the Date.now() read doesn't trip the component-purity lint rule. */
function hasFutureDeparture(departures: Departure[]): boolean {
  const now = Date.now();
  return departures.some((d) => d.status !== "cancelled" && new Date(d.startDate).getTime() >= now);
}

export default async function AdminToursPage() {
  const tours = await getAllToursAdmin();
  tours.sort((a, b) => a.title.localeCompare(b.title));

  const rows = await Promise.all(
    tours.map(async (tour) => {
      const departures = await getDeparturesForTour(tour.tourId);
      return { tour, hasFutureDeparture: hasFutureDeparture(departures) };
    })
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Tours</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {tours.length} {tours.length === 1 ? "tour" : "tours"}
          </p>
        </div>
        <Link
          href="/admin/tours/new"
          className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          + New tour
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No tours yet. Create the first one to get started.
        </p>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">Departures</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ tour, hasFutureDeparture }) => (
                <TourRow key={tour.tourId} tour={tour} hasFutureDeparture={hasFutureDeparture} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TourRow({ tour, hasFutureDeparture }: { tour: Tour; hasFutureDeparture: boolean }) {
  return (
    <tr className="align-middle">
      <td className="px-4 py-3">
        <p className="font-semibold text-ink">{tour.title}</p>
        <p className="text-xs text-ink-muted">/{tour.slug}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={tour.status} />
      </td>
      <td className="px-4 py-3 text-ink-muted">{tour.region}</td>
      <td className="px-4 py-3 text-ink-muted">
        {formatUsd(tour.pricing.pricePerPersonDouble)}
      </td>
      <td className="px-4 py-3">
        {hasFutureDeparture ? (
          <span className="text-ink-muted">Has upcoming</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/10 px-2.5 py-0.5 text-xs font-semibold text-terracotta-dark">
            No future dates
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/tours/${tour.tourId}/preview`}
            className="text-sm font-medium text-ink-muted hover:text-ink"
            target="_blank"
          >
            Preview
          </Link>
          <Link
            href={`/admin/tours/${tour.tourId}`}
            className="text-sm font-medium text-navy hover:text-navy-light"
          >
            Edit
          </Link>
          {tour.status !== "archived" && (
            <ArchiveTourButton tourId={tour.tourId} title={tour.title} />
          )}
        </div>
      </td>
    </tr>
  );
}

const STATUS_STYLES: Record<TourStatus, string> = {
  draft: "bg-gold/15 text-terracotta-dark",
  published: "bg-olive/15 text-olive",
  archived: "bg-ink-muted/15 text-ink-muted",
};

function StatusBadge({ status }: { status: TourStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
