import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import PayBalanceButton from "@/components/marketing/PayBalanceButton";
import { getBookingByPaymentLink } from "@/lib/actions/bookings";
import { createBalancePaymentIntent } from "@/lib/actions/payments";
import { formatUsd } from "@/lib/pricing";
import type { Booking, Departure, Tour } from "@/lib/types";

export const metadata: Metadata = { title: "Complete your payment" };

/**
 * Token-gated balance-payment page — not part of a customer account system
 * (there isn't one yet). The link is emailed/shared manually today, most
 * often after a departure flips from "conditional" to "guaranteed" and a
 * customer who already paid something still owes the rest.
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
            <p className="text-center text-lg leading-8 text-[var(--color-slate)]">{lookup.error}</p>
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

async function PaymentSummary({
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
  const intentResult = canPay ? await createBalancePaymentIntent(bookingId, token) : null;

  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-ice)]">{tour.title}</p>
      <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-mist)] sm:text-3xl">
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
          <p className="text-sm text-[var(--color-slate)]">This booking is no longer active.</p>
        ) : !canPay ? (
          <p className="text-sm font-semibold text-[var(--color-success)]">Paid in full — thank you!</p>
        ) : intentResult?.ok ? (
          <PayBalanceButton clientSecret={intentResult.clientSecret} amount={intentResult.amount} />
        ) : (
          <p className="text-sm text-[var(--color-danger-text)]">
            {intentResult && !intentResult.ok
              ? intentResult.error
              : "Couldn't start payment — please try again in a moment."}
          </p>
        )}
      </div>

      <a
        href="tel:18008470700"
        className="mt-8 inline-block text-sm font-bold text-[var(--color-ice)] transition hover:brightness-110"
      >
        Questions? Call 1-800-847-0700
      </a>
    </div>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--color-slate)]">{label}</dt>
      <dd className={`font-semibold ${accent ? "text-[var(--color-ice)]" : "text-[var(--color-mist)]"}`}>{value}</dd>
    </div>
  );
}
