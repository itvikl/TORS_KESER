import Link from "next/link";
import type { Metadata } from "next";
import { getAllToursAdmin } from "@/lib/data/admin/tours";
import { getDeparturesForTour } from "@/lib/data/tours";
import { isDeparturePlanned } from "@/lib/departureAvailability";
import { bySortOrder } from "@/lib/tourSort";
import { availableSeats, type Departure } from "@/lib/types";
import SortableToursTable, { type UpcomingCapacity } from "@/components/admin/SortableToursTable";

export const metadata: Metadata = { title: "Tours" };

function upcomingCapacity(departures: Departure[]): UpcomingCapacity {
  const upcoming = departures.filter(isDeparturePlanned);
  return {
    departureCount: upcoming.length,
    totalCapacity: upcoming.reduce((sum, d) => sum + d.capacityTotal, 0),
    totalAvailable: upcoming.reduce((sum, d) => sum + availableSeats(d), 0),
  };
}

export default async function AdminToursPage() {
  const tours = await getAllToursAdmin();
  tours.sort(bySortOrder);

  const rows = await Promise.all(
    tours.map(async (tour) => {
      const departures = await getDeparturesForTour(tour.tourId);
      return { tour, capacity: upcomingCapacity(departures) };
    })
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Tours</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {tours.length} {tours.length === 1 ? "tour" : "tours"} — drag the handle to reorder
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
        <SortableToursTable rows={rows} />
      )}
    </div>
  );
}
