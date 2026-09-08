import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TourPageView from "@/components/marketing/TourPageView";
import { getAllTours, getDeparturesForTour, getTourBySlug } from "@/lib/data/tours";
import { getSiteSettings } from "@/lib/data/admin/settings";

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

  return {
    title: tour.seoTitle ?? tour.title,
    description: tour.seoDescription ?? tour.summary,
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

  const [departures, settings] = await Promise.all([
    getDeparturesForTour(tour.tourId),
    getSiteSettings(),
  ]);

  return (
    <TourPageView
      tour={tour}
      departures={departures}
      lowSeatsThreshold={settings.lowSeatsThreshold}
    />
  );
}
