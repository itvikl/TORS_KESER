import Link from "next/link";
import type { Metadata } from "next";
import { getAllBookingsAdmin, getBookingCountsByTourAdmin } from "@/lib/data/admin/bookings";
import BookingsTourList from "@/components/admin/BookingsTourList";
import BookingsTable from "@/components/admin/BookingsTable";

const LATEST_COUNT = 10;

export const metadata: Metadata = { title: "Bookings" };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ latest?: string }>;
}) {
  const { latest } = await searchParams;
  const bookings = await getAllBookingsAdmin(); // newest first
  const rows = await getBookingCountsByTourAdmin(bookings);
  const showAll = latest === "all";
  const latestBookings = showAll ? bookings : bookings.slice(0, LATEST_COUNT);
  const totalRegistrants = rows.reduce((sum, r) => sum + r.registrantCount, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Bookings</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {totalRegistrants} registration{totalRegistrants === 1 ? "" : "s"} across{" "}
            {rows.length} tour{rows.length === 1 ? "" : "s"} — select a tour to see its planned
            departures
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          + New booking
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No registrations yet.
        </p>
      ) : (
        <>
          <section className="mb-10">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-bold text-ink">
                {showAll ? "All bookings" : "Latest bookings"}
              </h2>
              {bookings.length > LATEST_COUNT && (
                <Link
                  href={showAll ? "/admin/bookings" : "/admin/bookings?latest=all"}
                  className="text-sm font-medium text-navy hover:text-navy-light"
                >
                  {showAll ? `Show latest ${LATEST_COUNT}` : `Show all ${bookings.length}`}
                </Link>
              )}
            </div>
            <BookingsTable rows={latestBookings} />
          </section>

          <h2 className="mb-3 text-lg font-bold text-ink">By tour</h2>
          <BookingsTourList rows={rows} />
        </>
      )}
    </div>
  );
}
