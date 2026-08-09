import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTourByIdAdmin } from "@/lib/data/admin/tours";
import { getDepartureByIdAdmin } from "@/lib/data/admin/departures";
import { getAllStaffAdmin } from "@/lib/data/admin/staff";
import DepartureEditorForm from "@/components/admin/DepartureEditorForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tourId: string; departureId: string }>;
}): Promise<Metadata> {
  const { departureId } = await params;
  const departure = await getDepartureByIdAdmin(departureId);
  return { title: departure ? `Departure — ${departure.startDate}` : "Departure" };
}

export default async function EditDeparturePage({
  params,
}: {
  params: Promise<{ tourId: string; departureId: string }>;
}) {
  const { tourId, departureId } = await params;
  const [tour, departure, staff] = await Promise.all([
    getTourByIdAdmin(tourId),
    getDepartureByIdAdmin(departureId),
    getAllStaffAdmin(),
  ]);
  if (!tour || !departure || departure.tourId !== tourId) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Edit departure — {tour.title}
        </h1>
      </div>
      <DepartureEditorForm
        mode="edit"
        tourId={tourId}
        departureId={departureId}
        initialDeparture={departure}
        tour={tour}
        staff={staff}
      />
    </div>
  );
}
