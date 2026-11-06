import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TourEditorForm from "@/components/admin/TourEditorForm";
import { getTourByIdAdmin } from "@/lib/data/admin/tours";
import { getDeparturesForTour, getGuidesForDepartures } from "@/lib/data/tours";
import { getAdminSession } from "@/lib/auth/dal";
import { canDeleteTour, canAccessAdminPath } from "@/lib/auth/roles";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteTour } from "@/lib/actions/deletions";

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
  const role = (await getAdminSession())?.role;
  const canDelete = canDeleteTour(role, tour.status);
  const canManageDepartures = canAccessAdminPath(role, `/admin/tours/${tourId}/departures`);

  const departures = await getDeparturesForTour(tourId);
  const guides = await getGuidesForDepartures(departures);

  return (
    <div>
      {canDelete && (
        <div className="mb-4 flex justify-end">
          <DeleteButton action={deleteTour.bind(null, tourId)} what="this tour and its departure dates" redirectTo="/admin/tours" />
        </div>
      )}
      {canManageDepartures && (
        <div className="mb-4">
          <Link
            href={`/admin/tours/${tourId}/departures`}
            className="text-sm font-medium text-navy hover:text-navy-light"
          >
            Manage departures →
          </Link>
        </div>
      )}
      <TourEditorForm
        mode="edit"
        tourId={tourId} initialTour={tour}
        departures={departures}
        guides={guides}
      />
    </div>
  );
}
