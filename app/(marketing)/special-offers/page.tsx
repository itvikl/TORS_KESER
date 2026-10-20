import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import TourCard from "@/components/marketing/TourCard";
import { getSpecialOffers } from "@/lib/data/offers";
import { getDeparturesForTour, getSpecialOfferTours } from "@/lib/data/tours";
import { hasBookableDeparture, isDeparturePlanned } from "@/lib/departureAvailability";
import { getSiteContent } from "@/lib/data/siteContent";

export const metadata: Metadata = {
  title: "Special Offers",
  description: "Current deals and limited-time offers on Keshertours kosher tours.",
  alternates: { canonical: "/special-offers" },
};

export default async function SpecialOffersPage() {
  const [offers, specialOfferTours, content] = await Promise.all([
    getSpecialOffers(),
    getSpecialOfferTours(),
    getSiteContent("special-offers"),
  ]);

  // Same rule as the home page: a special offer with no upcoming date isn't listed.
  const tours = (
    await Promise.all(
      specialOfferTours.map(async (tour) => {
        const departures = await getDeparturesForTour(tour.tourId);
        return {
          tour,
          nextDeparture: departures.find(isDeparturePlanned),
          image: tour.heroImage || tour.gallery[0] || "",
          soldOut: !hasBookableDeparture(departures),
        };
      })
    )
  ).filter(({ nextDeparture }) => nextDeparture);

  const isEmpty = offers.length === 0 && tours.length === 0;

  return (
    <div>
      <PageHeader eyebrow={content.eyebrow} title={content.title} lede={content.lede} />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {isEmpty ? (
          <div className="glass-panel rounded-2xl border-dashed p-10 text-center">
            <p className="text-lg leading-8 text-[var(--color-slate)]">
              No special offers are live right now — check back soon, or
              leave your email and we&apos;ll let you know the moment one
              is published.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {offers.length > 0 && (
              <ul className="space-y-4">
                {offers.map((offer) => (
                  <li
                    key={offer.offerId}
                    className="glass-panel rounded-2xl p-6 sm:p-8"
                  >
                    <h2 className="text-xl font-bold tracking-tight text-[var(--color-mist)]">
                      {offer.title}
                    </h2>
                    <p className="mt-3 text-[15px] leading-7 text-[var(--color-slate)]">
                      {offer.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {tours.length > 0 && (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {tours.map(({ tour, nextDeparture, image, soldOut }) => (
                  <TourCard
                    key={tour.tourId}
                    tour={tour}
                    nextDeparture={nextDeparture}
                    image={image}
                    soldOut={soldOut}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
