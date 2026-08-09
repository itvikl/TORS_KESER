import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDepartureRegistrantsAdmin } from "@/lib/data/admin/history";
import type { BookingStatus } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ departureId: string }>;
}): Promise<Metadata> {
  const { departureId } = await params;
  const { tour } = await getDepartureRegistrantsAdmin(departureId);
  return { title: tour ? `Registrants — ${tour.title}` : "Registrants" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function DepartureRegistrantsPage({
  params,
}: {
  params: Promise<{ departureId: string }>;
}) {
  const { departureId } = await params;
  const { departure, tour, registrants } = await getDepartureRegistrantsAdmin(departureId);
  if (!departure) notFound();

  return (
    <div>
      <Link href="/admin/history" className="text-sm font-medium text-navy hover:text-navy-light">
        ← Back to history
      </Link>

      <div className="mt-3 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{tour?.title ?? "Departure"}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {formatDate(departure.startDate)} – {formatDate(departure.endDate)}
        </p>
      </div>

      {registrants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No registrants on this departure.
        </p>
      ) : (
        <div className="space-y-4">
          {registrants.map(({ booking, travelers }) => (
            <div key={booking.bookingId} className="rounded-xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{booking.contactName}</p>
                  <p className="text-xs text-ink-muted">
                    {booking.contactEmail}
                    {booking.contactPhone ? ` · ${booking.contactPhone}` : ""}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              {travelers.length > 0 && (
                <ul className="mt-3 divide-y divide-line border-t border-line pt-3">
                  {travelers.map((traveler) => (
                    <li
                      key={traveler.travelerId}
                      className="flex items-center justify-between py-1.5 text-sm"
                    >
                      <span className="text-ink">
                        {traveler.firstName} {traveler.lastName}
                      </span>
                      <span className="text-ink-muted capitalize">
                        {traveler.occupancy}
                        {traveler.roomWith ? ` · with ${traveler.roomWith}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
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
      className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
