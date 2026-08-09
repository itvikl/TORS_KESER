import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import TourCard from "@/components/marketing/TourCard";
import { getSpecialOffers } from "@/lib/data/offers";
import { getDeparturesForTour, getSpecialOfferTours } from "@/lib/data/tours";

export const metadata: Metadata = {
  title: "Special Offers",
};

export default async function SpecialOffersPage() {
  const [offers, specialOfferTours] = await Promise.all([
    getSpecialOffers(),
    getSpecialOfferTours(),
  ]);

  const tours = await Promise.all(
    specialOfferTours.map(async (tour) => ({
      tour,
      nextDeparture: (await getDeparturesForTour(tour.tourId))[0],
      image: tour.heroImage || tour.gallery[0] || "",
    }))
  );

  const isEmpty = offers.length === 0 && tours.length === 0;

  return (
    <div>
      <PageHeader
        eyebrow="Limited Time"
        title="Special Offers"
        lede="Seasonal deals and early-booking discounts, published straight from the admin panel — no developer required."
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {isEmpty ? (
          <div className="glass-panel rounded-2xl border-dashed p-10 text-center">
            <p className="text-lg leading-8 text-[#a0b4c4]">
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
                    <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">
                      {offer.title}
                    </h2>
                    <p className="mt-3 text-[15px] leading-7 text-[#a0b4c4]">
                      {offer.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {tours.length > 0 && (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {tours.map(({ tour, nextDeparture, image }) => (
                  <TourCard
                    key={tour.tourId}
                    tour={tour}
                    nextDeparture={nextDeparture}
                    image={image}
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
