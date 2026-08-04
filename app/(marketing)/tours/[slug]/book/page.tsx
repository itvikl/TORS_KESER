import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookingForm from "@/components/marketing/BookingForm";
import PageHeader from "@/components/marketing/PageHeader";
import { getDeparturesForTour, getTourBySlug } from "@/lib/data/tours";
import { availableSeats, type Departure } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  return { title: tour ? `Register — ${tour.title}` : "Register" };
}

/** Plain helper (not the page component) so the Date.now() read doesn't trip the component-purity lint rule. */
function isBookable(departure: Departure): boolean {
  return (
    departure.status === "open" &&
    availableSeats(departure) > 0 &&
    new Date(departure.startDate).getTime() >= Date.now()
  );
}

export default async function BookTourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const departures = await getDeparturesForTour(tour.tourId);
  const bookable = departures.filter(isBookable);

  return (
    <div>
      <PageHeader eyebrow="Register" title={tour.title} />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {bookable.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center">
            <p className="text-ink-muted">
              There are no open departure dates for this tour right now. Call us at{" "}
              <a href="tel:18008470700" className="font-semibold text-terracotta">
                1-800-847-0700
              </a>{" "}
              and we&apos;ll help you find the right trip.
            </p>
          </div>
        ) : (
          <BookingForm tour={tour} departures={bookable} />
        )}
      </div>
    </div>
  );
}
