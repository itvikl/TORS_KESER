import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TourPageView from "@/components/marketing/TourPageView";
import {
  getAllTours,
  getDeparturesForTour,
  getGuidesForDepartures,
  getTourBySlug,
} from "@/lib/data/tours";
import { getSiteSettings } from "@/lib/data/admin/settings";
import { getApprovedReviewsForTour } from "@/lib/data/reviews";

// Tour pages are prerendered (generateStaticParams below), and without this
// they would stay frozen at build time forever — s-maxage=31536000. Photos
// and copy edited straight in Firestore (e.g. the legacy-image backfills in
// scripts/migrate/) never go through a server action, so nothing calls
// revalidatePath for them. An hourly ISR window means those edits appear
// without a redeploy; admin-UI edits still bust the cache immediately.
export const revalidate = 3600;

export async function generateStaticParams() {
  const tours = await getAllTours();
  return tours.map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return {};

  const title = tour.seoTitle ?? tour.title;
  const description = tour.seoDescription ?? tour.summary;
  // Canonical is the current slug, so a tour reached by an old slug
  // (slugHistory) doesn't compete with itself in search.
  return {
    title,
    description,
    alternates: { canonical: `/tours/${tour.slug}` },
    openGraph: { title, description, url: `/tours/${tour.slug}`, images: tour.heroImage ? [tour.heroImage] : undefined },
  };
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const [departures, settings, testimonials] = await Promise.all([
    getDeparturesForTour(tour.tourId),
    getSiteSettings(),
    getApprovedReviewsForTour(tour),
  ]);
  const guides = await getGuidesForDepartures(departures);

  return (
    <TourPageView
      tour={tour}
      departures={departures}
      guides={guides}
      testimonials={testimonials}
      lowSeatsThreshold={settings.lowSeatsThreshold}
    />
  );
}
