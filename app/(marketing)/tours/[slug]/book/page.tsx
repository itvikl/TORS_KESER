import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookingForm from "@/components/marketing/BookingForm";
import BookingPageBackground from "@/components/marketing/BookingPageBackground";
import PageHeader from "@/components/marketing/PageHeader";
import { getDeparturesForTour, getTourBySlug } from "@/lib/data/tours";
import { getSiteSettings } from "@/lib/data/admin/settings";
import { hasPlannedDeparture, isDepartureBookable } from "@/lib/departureAvailability";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  return { title: tour ? `Register — ${tour.title}` : "Register" };
}

export default async function BookTourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const [departures, settings] = await Promise.all([
    getDeparturesForTour(tour.tourId),
    getSiteSettings(),
  ]);
  const bookable = departures.filter(isDepartureBookable);
  const planned = hasPlannedDeparture(departures);

  return (
    <div className="relative isolate overflow-hidden">
      <BookingPageBackground images={[tour.heroImage, ...tour.gallery]} />
      <PageHeader
        eyebrow="Register"
        title={tour.title}
        lede="Reserve your place — choose dates, party size, and traveler details below."
        transparent
      />
      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {!planned ? (
          <div className="glass-panel rounded-3xl p-8 text-center sm:p-10">
            <p className="text-lg leading-8 text-[var(--color-slate)]">
              The next date for this tour will be published soon. Call us at{" "}
              <a
                href="tel:18008470700"
                className="font-bold text-[var(--color-ice)] transition hover:brightness-110"
              >
                1-800-847-0700
              </a>{" "}
              and we&apos;ll let you know the moment it&apos;s live.
            </p>
          </div>
        ) : bookable.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center sm:p-10">
            <p className="text-lg leading-8 text-[var(--color-slate)]">
              There are no open departure dates for this tour right now. Call us at{" "}
              <a
                href="tel:18008470700"
                className="font-bold text-[var(--color-ice)] transition hover:brightness-110"
              >
                1-800-847-0700
              </a>{" "}
              and we&apos;ll help you find the right trip.
            </p>
          </div>
        ) : (
          <BookingForm
            tour={tour}
            departures={bookable}
            lowSeatsThreshold={settings.lowSeatsThreshold}
          />
        )}
      </div>
    </div>
  );
}
