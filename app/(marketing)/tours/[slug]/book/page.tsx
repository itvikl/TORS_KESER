import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookingForm from "@/components/marketing/BookingForm";
import BookingPageBackground from "@/components/marketing/BookingPageBackground";
import PageHeader from "@/components/marketing/PageHeader";
import { getDeparturesForTour, getTourBySlug } from "@/lib/data/tours";
import { getSiteSettings } from "@/lib/data/admin/settings";
import { hasPlannedDeparture, isDepartureBookable } from "@/lib/departureAvailability";
import { PhoneLink } from "@/components/marketing/SitePhone";
import { getSiteContent } from "@/lib/data/siteContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  return { title: tour ? `Register — ${tour.title}` : "Register", robots: { index: false, follow: false } };
}

/** Renders admin-written text, turning each {phone} into the site's phone link. */
function TextWithPhoneLink({ text }: { text: string }) {
  return text.split("{phone}").map((part, index) => (
    <span key={index}>
      {index > 0 && (
        <PhoneLink className="font-bold text-[var(--color-ice)] transition hover:brightness-110" />
      )}
      {part}
    </span>
  ));
}

export default async function BookTourPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  /** ?departure= is set by the per-date "Book" buttons on the tour page. */
  searchParams: Promise<{ departure?: string | string[] }>;
}) {
  const { slug } = await params;
  const { departure: requestedDepartureId } = await searchParams;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const [departures, settings, copy, tourCopy] = await Promise.all([
    getDeparturesForTour(tour.tourId),
    getSiteSettings(),
    getSiteContent("booking"),
    getSiteContent("tour-page"),
  ]);
  const bookable = departures.filter(isDepartureBookable);
  const planned = hasPlannedDeparture(departures);

  return (
    <div className="relative isolate overflow-hidden">
      <BookingPageBackground images={[tour.heroImage, ...tour.gallery]} />
      <PageHeader
        eyebrow={copy.headerEyebrow}
        title={tour.title}
        lede={copy.headerLede}
        transparent
      />
      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {!planned ? (
          <div className="glass-panel rounded-3xl p-8 text-center sm:p-10">
            <p className="text-lg leading-8 text-[var(--color-slate)]">
              <TextWithPhoneLink text={copy.noDatesMessage} />
            </p>
          </div>
        ) : bookable.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center sm:p-10">
            <p className="text-lg leading-8 text-[var(--color-slate)]">
              <TextWithPhoneLink text={copy.noOpenDatesMessage} />
            </p>
          </div>
        ) : (
          <BookingForm
            tour={tour}
            departures={bookable}
            initialDepartureId={
              typeof requestedDepartureId === "string" ? requestedDepartureId : undefined
            }
            lowSeatsThreshold={settings.lowSeatsThreshold}
            copy={copy}
            statusCopy={{
              statusSoldOut: tourCopy.statusSoldOut,
              statusCancelled: tourCopy.statusCancelled,
              statusLowSeats: tourCopy.statusLowSeats,
              statusAvailable: tourCopy.statusAvailable,
            }}
          />
        )}
      </div>
    </div>
  );
}
