import Link from "next/link";
import type { Metadata } from "next";
import { getAllBookingsAdmin } from "@/lib/data/admin/bookings";
import { formatUsd } from "@/lib/pricing";
import { availableSeats, type BookingStatus, type ContactPreference } from "@/lib/types";

export const metadata: Metadata = { title: "Bookings" };

export default async function AdminBookingsPage() {
  const rows = await getAllBookingsAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Bookings</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} registration{rows.length === 1 ? "" : "s"} submitted
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
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3">Departure</th>
                <th className="px-4 py-3">Travelers</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Wants</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ booking, tour, departure }) => (
                <tr key={booking.bookingId} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{booking.contactName}</p>
                    <p className="text-xs text-ink-muted">{booking.contactEmail}</p>
                    {booking.contactPhone && (
                      <p className="text-xs text-ink-muted">{booking.contactPhone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{tour?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {departure
                      ? new Date(departure.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{booking.travelerCount}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {departure ? `${availableSeats(departure)} / ${departure.capacityTotal} left` : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {formatUsd(booking.priceBreakdown.grandTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ContactPreferenceBadge preference={booking.contactPreference} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(booking.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
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

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending_payment: "bg-gold/15 text-terracotta-dark",
  deposit_paid: "bg-olive/15 text-olive",
  paid_in_full: "bg-olive/25 text-olive",
  cancelled: "bg-ink-muted/15 text-ink-muted",
  refunded: "bg-ink-muted/15 text-ink-muted",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: "Pending payment",
  deposit_paid: "Deposit paid",
  paid_in_full: "Paid in full",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function ContactPreferenceBadge({ preference }: { preference: ContactPreference }) {
  return (
    <span className="inline-block rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-semibold text-navy">
      {preference === "callback" ? "Call back" : "Pay online"}
    </span>
  );
}
