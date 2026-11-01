import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/marketing/PageHeader";
import { getBookingSummary } from "@/lib/data/bookings";
import { formatUsd } from "@/lib/pricing";
import { PhoneLink } from "@/components/marketing/SitePhone";
import { getSiteContent } from "@/lib/data/siteContent";

export const metadata: Metadata = { title: "Payment received", robots: { index: false, follow: false } };

/**
 * Booking confirmation summary, keyed off a bookingId query param. The
 * booking itself is only ever marked paid by the webhook
 * (app/api/webhooks/stripe/route.ts) — this page just reads back the
 * current state to confirm it to the customer.
 */
export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { booking: bookingId } = await searchParams;
  const summary = bookingId ? await getBookingSummary(bookingId) : null;
  if (!summary) notFound();
  const copy = await getSiteContent("booking");

  return (
    <div>
      <PageHeader
        eyebrow={copy.successEyebrow}
        title={copy.successTitle}
        lede={copy.successLede}
      />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass-panel-elevated rounded-3xl p-8 text-center shadow-2xl sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-ice)]/40 bg-[var(--color-ice)]/20 text-4xl text-[var(--color-ice)]">
            ✓
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-ice)]">
            {copy.successBadge}
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-mist)] sm:text-3xl">
            {copy.successHeading}
          </h2>

          <dl className="mx-auto mt-8 grid max-w-sm gap-3 text-left text-[15px]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--color-slate)]">{copy.successPaid}</dt>
              <dd className="font-semibold text-[var(--color-mist)]">{formatUsd(summary.amountPaid)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--color-slate)]">{copy.successTotal}</dt>
              <dd className="font-semibold text-[var(--color-mist)]">{formatUsd(summary.grandTotal)}</dd>
            </div>
          </dl>

          <PhoneLink className="mt-8 inline-block text-sm font-bold text-[var(--color-ice)] transition hover:brightness-110" prefix={`${copy.questionsPrefix} `} />
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-slate)]">
          <Link href="/" className="font-semibold text-[var(--color-ice)] transition hover:brightness-110">
            {copy.successHomeLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
