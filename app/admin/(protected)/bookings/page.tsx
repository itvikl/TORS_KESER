import Link from "next/link";
import type { Metadata } from "next";
import { getAllBookingsAdmin } from "@/lib/data/admin/bookings";
import BookingsTable from "@/components/admin/BookingsTable";

export const metadata: Metadata = { title: "Bookings" };

export default async function AdminBookingsPage() {
  const rows = await getAllBookingsAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Bookings</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} registration{rows.length === 1 ? "" : "s"} submitted — click a row for full details
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
        <BookingsTable rows={rows} />
      )}
    </div>
  );
}
