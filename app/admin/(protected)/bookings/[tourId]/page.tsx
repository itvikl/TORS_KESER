import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookingsForTourAdmin } from "@/lib/data/admin/bookings";
import { getTourByIdAdmin } from "@/lib/data/admin/tours";
import BookingsTable from "@/components/admin/BookingsTable";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tourId: string }>;
}): Promise<Metadata> {
  const { tourId } = await params;
  const tour = await getTourByIdAdmin(tourId);
  return { title: tour ? `${tour.title} — Bookings` : "Bookings" };
}

export default async function TourBookingsPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const [tour, rows] = await Promise.all([
    getTourByIdAdmin(tourId),
    getBookingsForTourAdmin(tourId),
  ]);
  if (!tour) notFound();

  return (
    <div>
      <Link href="/admin/bookings" className="text-sm font-medium text-navy hover:text-navy-light">
        ← All tours
      </Link>

      <div className="mb-6 mt-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{tour.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} registration{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        {rows.length > 0 && (
          <a
            href={`/admin/bookings/${tourId}/export`}
            className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
          >
            Export to Excel
          </a>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No registrations yet for this tour.
        </p>
      ) : (
        <BookingsTable rows={rows} />
      )}
    </div>
  );
}
