import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/dal";
import { getBookingsForTourAdmin } from "@/lib/data/admin/bookings";
import { getTourByIdAdmin } from "@/lib/data/admin/tours";
import { buildBookingsWorkbook } from "@/lib/export/bookingsWorkbook";

/**
 * Excel download for one tour's registrants. A route handler (not a Server
 * Action) since a binary .xlsx payload doesn't need to cross the RSC/server
 * action wire format — a plain <a href> here triggers a normal browser
 * download via Content-Disposition, no client JS required.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tourId: string }> }
) {
  await requireAdminSession();

  const { tourId } = await params;
  const tour = await getTourByIdAdmin(tourId);
  if (!tour) return new NextResponse("Tour not found", { status: 404 });

  const rows = await getBookingsForTourAdmin(tourId);
  const buffer = await buildBookingsWorkbook(tour, rows);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${tour.slug}-registrants.xlsx"`,
    },
  });
}
