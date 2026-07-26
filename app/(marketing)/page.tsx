import Link from "next/link";
import DestinationSearch from "@/components/marketing/DestinationSearch";
import TourCard from "@/components/marketing/TourCard";
import { getDeparturesForTour, getFeaturedTours } from "@/lib/data/tours";

export default async function HomePage() {
  const featured = await getFeaturedTours();
  const featuredWithDepartures = await Promise.all(
    featured.map(async (tour) => ({
      tour,
      nextDeparture: (await getDeparturesForTour(tour.tourId))[0],
    }))
  );

  return (
    <div>
      <section className="relative overflow-hidden bg-navy px-4 py-20 text-center sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Travel the World the Jewish Way
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-white sm:text-5xl">
            Kosher tours to the places you&apos;ve always wanted to see
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Fully escorted, fully kosher journeys across six continents —
            with a guide and kashrut supervisor traveling with you every
            step of the way.
          </p>
        </div>
        <div className="mt-10">
          <DestinationSearch />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
            Featured Tours
          </h2>
          <Link
            href="/tours"
            className="text-sm font-semibold text-terracotta hover:underline"
          >
            View all tours →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredWithDepartures.map(({ tour, nextDeparture }) => (
            <TourCard key={tour.tourId} tour={tour} nextDeparture={nextDeparture} />
          ))}
        </div>
      </section>

      <section className="bg-sand-warm px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
          <TrustSignal
            title="Kashrut You Can Trust"
            body="Every tour travels with a company mashgiach in addition to local rabbinic supervision — not just a promise, a person."
          />
          <TrustSignal
            title="Guided Every Step"
            body="A Shomer Shabbat, English-speaking guide accompanies the group from arrival to departure."
          />
          <TrustSignal
            title="24/7 Support"
            body="Questions before you go, or while you're there — call anytime, day or night."
          />
        </div>
      </section>
    </div>
  );
}

function TrustSignal({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center">
      <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-[15px] text-ink-muted">{body}</p>
    </div>
  );
}
