import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookingsForDepartureAdmin } from "@/lib/data/admin/bookings";
import { getTourByIdAdmin } from "@/lib/data/admin/tours";
import BookingsTable from "@/components/admin/BookingsTable";
import MarkDepartureViewed from "@/components/admin/MarkDepartureViewed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tourId: string; departureId: string }>;
}): Promise<Metadata> {
  const { tourId } = await params;
  const tour = await getTourByIdAdmin(tourId);
  return { title: tour ? `${tour.title} — Bookings` : "Bookings" };
}

export default async function DepartureBookingsPage({
  params,
}: {
  params: Promise<{ tourId: string; departureId: string }>;
}) {
  const { tourId, departureId } = await params;
  const [tour, rows] = await Promise.all([
    getTourByIdAdmin(tourId),
    getBookingsForDepartureAdmin(tourId, departureId),
  ]);
  if (!tour) notFound();

  const departure = rows[0]?.departure;

  return (
    <div>
      {rows.length > 0 && <MarkDepartureViewed tourId={tourId} departureId={departureId} />}
      <Link
        href={`/admin/bookings/${tourId}`}
        className="text-sm font-medium text-navy hover:text-navy-light"
      >
        ← {tour.title} departures
      </Link>

      <div className="mb-6 mt-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {tour.title}
            {departure && (
              <span className="text-ink-muted">
                {" — "}
                {new Date(departure.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} registration{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        {rows.length > 0 && (
          <a
            href={`/admin/bookings/${tourId}/${departureId}/export`}
            className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
          >
            Export to Excel
          </a>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No registrations yet for this departure.
        </p>
      ) : (
        <BookingsTable rows={rows} />
      )}
    </div>
  );
}
