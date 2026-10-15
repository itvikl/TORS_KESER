import "server-only";
import ExcelJS from "exceljs";
import type { DepartureRegistrantsResult } from "@/lib/data/admin/history";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  partial_paid: "Partially paid",
  paid_in_full: "Paid in full",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US");
}

/**
 * Past departures export — a "Departures" summary sheet plus a
 * "Travelers" sheet with one row per traveler (contact/payment columns
 * repeated per row so the sheet filters/sorts cleanly in Excel).
 */
export async function buildHistoryWorkbook(results: DepartureRegistrantsResult[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const departuresSheet = workbook.addWorksheet("Departures");
  departuresSheet.columns = [
    { header: "Tour", key: "tour", width: 36 },
    { header: "Start date", key: "start", width: 14 },
    { header: "End date", key: "end", width: 14 },
    { header: "Bookings", key: "bookings", width: 10 },
    { header: "Travelers", key: "travelers", width: 10 },
    { header: "Total paid", key: "paid", width: 14 },
  ];

  const travelersSheet = workbook.addWorksheet("Travelers");
  travelersSheet.columns = [
    { header: "Tour", key: "tour", width: 36 },
    { header: "Start date", key: "start", width: 14 },
    { header: "Traveler", key: "traveler", width: 24 },
    { header: "Occupancy", key: "occupancy", width: 12 },
    { header: "Dietary", key: "dietary", width: 18 },
    { header: "Booking contact", key: "contactName", width: 24 },
    { header: "Email", key: "contactEmail", width: 28 },
    { header: "Phone", key: "contactPhone", width: 18 },
    { header: "Booking status", key: "status", width: 16 },
    { header: "Booking total", key: "total", width: 14 },
    { header: "Booking paid", key: "paid", width: 14 },
  ];

  for (const sheet of [departuresSheet, travelersSheet]) sheet.getRow(1).font = { bold: true };

  for (const { departure, tour, registrants } of results) {
    if (!departure) continue;
    const tourTitle = tour?.title ?? "";
    const active = registrants.filter(({ booking }) => booking.status !== "cancelled");

    departuresSheet.addRow({
      tour: tourTitle,
      start: formatDate(departure.startDate),
      end: formatDate(departure.endDate),
      bookings: active.length,
      travelers: active.reduce((sum, { booking }) => sum + booking.travelerCount, 0),
      paid: registrants.reduce((sum, { booking }) => sum + booking.amountPaid, 0),
    });

    for (const { booking, travelers } of registrants) {
      // Bookings without a travelers subcollection still get one row so the contact isn't lost.
      const rows = travelers.length > 0 ? travelers : [null];
      for (const traveler of rows) {
        travelersSheet.addRow({
          tour: tourTitle,
          start: formatDate(departure.startDate),
          traveler: traveler ? `${traveler.firstName} ${traveler.lastName}` : "",
          occupancy: traveler?.occupancy ?? "",
          dietary: traveler?.dietary ?? "",
          contactName: booking.contactName,
          contactEmail: booking.contactEmail,
          contactPhone: booking.contactPhone ?? "",
          status: STATUS_LABELS[booking.status] ?? booking.status,
          total: booking.priceBreakdown.grandTotal,
          paid: booking.amountPaid,
        });
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
