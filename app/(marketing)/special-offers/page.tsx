import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import { getSpecialOffers } from "@/lib/data/offers";

export const metadata: Metadata = {
  title: "Special Offers",
};

export default async function SpecialOffersPage() {
  const offers = await getSpecialOffers();

  return (
    <div>
      <PageHeader
        eyebrow="Limited Time"
        title="Special Offers"
        lede="Seasonal deals and early-booking discounts, published straight from the admin panel — no developer required."
      />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-sand-warm p-8 text-center">
            <p className="text-ink-muted">
              No special offers are live right now — check back soon, or
              leave your email and we&apos;ll let you know the moment one
              is published.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {offers.map((offer) => (
              <li key={offer.offerId} className="rounded-2xl border border-line bg-white/60 p-6">
                <h2 className="font-display text-xl font-semibold text-navy">{offer.title}</h2>
                <p className="mt-2 text-[15px] text-ink-muted">{offer.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
