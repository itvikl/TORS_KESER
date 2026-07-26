import type { Metadata } from "next";
import TourCard from "@/components/marketing/TourCard";
import { getAllTours, getDeparturesForTour } from "@/lib/data/tours";

export const metadata: Metadata = {
  title: "All Kosher Tours",
  description: "Browse every kosher tour Keshertours currently offers, worldwide.",
};

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region } = await searchParams;
  const allTours = await getAllTours();
  const tours = region ? allTours.filter((t) => t.region === region) : allTours;

  const toursWithDepartures = await Promise.all(
    tours.map(async (tour) => ({
      tour,
      nextDeparture: (await getDeparturesForTour(tour.tourId))[0],
    }))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
        {region ? `Kosher Tours to ${region}` : "All Kosher Tours"}
      </h1>
      <p className="mt-2 text-ink-muted">
        {tours.length} tour{tours.length === 1 ? "" : "s"} found
      </p>

      {tours.length === 0 ? (
        <p className="mt-8 text-ink-muted">
          No tours match that destination right now — call us at{" "}
          <a href="tel:18008470700" className="font-semibold text-terracotta">
            1-800-847-0700
          </a>{" "}
          and we&apos;ll help you find the right trip.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {toursWithDepartures.map(({ tour, nextDeparture }) => (
            <TourCard key={tour.tourId} tour={tour} nextDeparture={nextDeparture} />
          ))}
        </div>
      )}
    </div>
  );
}
