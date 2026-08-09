import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TourEditorForm from "@/components/admin/TourEditorForm";
import { getTourByIdAdmin } from "@/lib/data/admin/tours";
import { getDeparturesForTour } from "@/lib/data/tours";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tourId: string }>;
}): Promise<Metadata> {
  const { tourId } = await params;
  const tour = await getTourByIdAdmin(tourId);
  return { title: tour ? `Edit — ${tour.title}` : "Tour" };
}

export default async function EditTourPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const tour = await getTourByIdAdmin(tourId);
  if (!tour) notFound();

  const departures = await getDeparturesForTour(tourId);

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/admin/tours/${tourId}/departures`}
          className="text-sm font-medium text-navy hover:text-navy-light"
        >
          Manage departures →
        </Link>
      </div>
      <TourEditorForm mode="edit" tourId={tourId} initialTour={tour} departures={departures} />
    </div>
  );
}
