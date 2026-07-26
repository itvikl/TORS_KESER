import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TourPageView from "@/components/marketing/TourPageView";
import { getAllTours, getDeparturesForTour, getTourBySlug } from "@/lib/data/tours";

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

  const departures = await getDeparturesForTour(tour.tourId);

  return <TourPageView tour={tour} departures={departures} />;
}
