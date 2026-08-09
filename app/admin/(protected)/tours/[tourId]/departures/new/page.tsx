import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTourByIdAdmin } from "@/lib/data/admin/tours";
import { getAllStaffAdmin } from "@/lib/data/admin/staff";
import DepartureEditorForm from "@/components/admin/DepartureEditorForm";

export const metadata: Metadata = { title: "New departure" };

export default async function NewDeparturePage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const [tour, staff] = await Promise.all([getTourByIdAdmin(tourId), getAllStaffAdmin()]);
  if (!tour) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">New departure — {tour.title}</h1>
      </div>
      <DepartureEditorForm mode="create" tourId={tourId} tour={tour} staff={staff} />
    </div>
  );
}
