import "server-only";
import ExcelJS from "exceljs";
import type { AdminBookingRow } from "@/lib/data/admin/bookings";
import type { Tour } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  deposit_paid: "Deposit paid",
  paid_in_full: "Paid in full",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export async function buildBookingsWorkbook(
  tour: Tour,
  rows: AdminBookingRow[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Registrants");

  sheet.columns = [
    { header: "Contact name", key: "contactName", width: 24 },
    { header: "Email", key: "contactEmail", width: 28 },
    { header: "Phone", key: "contactPhone", width: 18 },
    { header: "Departure date", key: "departureDate", width: 16 },
    { header: "Travelers", key: "travelerCount", width: 10 },
    { header: "Status", key: "status", width: 16 },
    { header: "Deposit", key: "deposit", width: 12 },
    { header: "Paid", key: "paid", width: 12 },
    { header: "Total", key: "total", width: 12 },
    { header: "Contact preference", key: "contactPreference", width: 16 },
    { header: "Submitted", key: "submitted", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const { booking, departure } of rows) {
    sheet.addRow({
      contactName: booking.contactName,
      contactEmail: booking.contactEmail,
      contactPhone: booking.contactPhone ?? "",
      departureDate: departure ? new Date(departure.startDate).toLocaleDateString("en-US") : "",
      travelerCount: booking.travelerCount,
      status: STATUS_LABELS[booking.status] ?? booking.status,
      deposit: booking.depositAmount,
      paid: booking.amountPaid,
      total: booking.priceBreakdown.grandTotal,
      contactPreference: booking.contactPreference === "callback" ? "Call back" : "Pay online",
      submitted: new Date(booking.createdAt).toLocaleDateString("en-US"),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
