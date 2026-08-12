import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import PayBalanceButton from "@/components/marketing/PayBalanceButton";
import { getBookingByPaymentLink } from "@/lib/actions/bookings";
import { formatUsd } from "@/lib/pricing";
import type { Booking, Departure, Tour } from "@/lib/types";

export const metadata: Metadata = { title: "Complete your payment" };

/**
 * Token-gated balance-payment page — not part of a customer account system
 * (there isn't one yet). The link is emailed/shared manually today (no real
 * ESP integration exists — see coral-wandering-lantern.md D5), most often
 * after a departure flips from "conditional" to "guaranteed" and a customer
 * who already paid something still owes the rest.
 */
export default async function PayBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { bookingId } = await params;
  const { token } = await searchParams;

  const lookup = await getBookingByPaymentLink(bookingId, token ?? "");

  return (
    <div>
      <PageHeader eyebrow="Payment" title="Complete your payment" />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass-panel-elevated rounded-3xl p-8 shadow-2xl sm:p-10">
          {!lookup.ok ? (
            <p className="text-center text-lg leading-8 text-[#a0b4c4]">{lookup.error}</p>
          ) : (
            <PaymentSummary
              bookingId={bookingId}
              token={token ?? ""}
              booking={lookup.booking}
              tour={lookup.tour}
              departure={lookup.departure}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentSummary({
  bookingId,
  token,
  booking,
  tour,
  departure,
}: {
  bookingId: string;
  token: string;
  booking: Booking;
  tour: Tour;
  departure: Departure;
}) {
  const isActive = booking.status !== "cancelled" && booking.status !== "refunded";
  const canPay = isActive && booking.balanceAmount > 0;

  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#7dd3fc]">{tour.title}</p>
      <h2 className="mt-2 font-display text-2xl font-bold text-[#e0e8f0] sm:text-3xl">
        {new Date(departure.startDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </h2>

      <dl className="mx-auto mt-8 grid max-w-sm gap-3 text-left text-[15px]">
        <Row label="Trip total" value={formatUsd(booking.priceBreakdown.grandTotal)} />
        <Row label="Paid so far" value={formatUsd(booking.amountPaid)} />
        <Row label="Balance due" value={formatUsd(booking.balanceAmount)} accent />
      </dl>

      <div className="mt-8">
        {!isActive ? (
          <p className="text-sm text-[#a0b4c4]">This booking is no longer active.</p>
        ) : !canPay ? (
          <p className="text-sm font-semibold text-[#10b981]">Paid in full — thank you!</p>
        ) : (
          <PayBalanceButton
            bookingId={bookingId}
            token={token}
            label={`Pay ${formatUsd(booking.balanceAmount)} now`}
          />
        )}
      </div>

      <a
        href="tel:18008470700"
        className="mt-8 inline-block text-sm font-bold text-[#7dd3fc] transition hover:brightness-110"
      >
        Questions? Call 1-800-847-0700
      </a>
    </div>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[#a0b4c4]">{label}</dt>
      <dd className={`font-semibold ${accent ? "text-[#7dd3fc]" : "text-[#e0e8f0]"}`}>{value}</dd>
    </div>
  );
}
