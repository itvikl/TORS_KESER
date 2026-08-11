import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/marketing/PageHeader";
import { getBookingSummary } from "@/lib/data/bookings";
import { formatUsd } from "@/lib/pricing";

export const metadata: Metadata = { title: "Payment received" };

/**
 * Landing page for Stripe's Checkout `success_url`
 * (lib/actions/bookings.ts:tryCreateCheckoutSession). The booking itself is
 * only ever marked paid by the webhook (app/api/webhooks/stripe/route.ts) —
 * this page just reads back the current state to confirm it to the customer.
 */
export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { booking: bookingId } = await searchParams;
  const summary = bookingId ? await getBookingSummary(bookingId) : null;
  if (!summary) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Registration"
        title="Payment received"
        lede="Thank you — your deposit is confirmed."
      />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass-panel-elevated rounded-3xl p-8 text-center shadow-2xl sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-ice)]/40 bg-[var(--color-ice)]/20 text-4xl text-[var(--color-ice)]">
            ✓
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-ice)]">
            Deposit received
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-mist)] sm:text-3xl">
            We look forward to welcoming you
          </h2>

          <dl className="mx-auto mt-8 grid max-w-sm gap-3 text-left text-[15px]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--color-slate)]">Paid so far</dt>
              <dd className="font-semibold text-[var(--color-mist)]">{formatUsd(summary.amountPaid)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--color-slate)]">Trip total</dt>
              <dd className="font-semibold text-[var(--color-mist)]">{formatUsd(summary.grandTotal)}</dd>
            </div>
          </dl>

          <a
            href="tel:18008470700"
            className="mt-8 inline-block text-sm font-bold text-[var(--color-ice)] transition hover:brightness-110"
          >
            Questions? Call 1-800-847-0700
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-slate)]">
          <Link href="/" className="font-semibold text-[var(--color-ice)] transition hover:brightness-110">
            Back to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
