import "server-only";
import ExcelJS from "exceljs";
import type { AdminLeadRow } from "@/lib/data/admin/leads";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "@/lib/leadLabels";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US");
}

/** Leads export — one row per lead, newest first (same order as the admin table). */
export async function buildLeadsWorkbook(rows: AdminLeadRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Leads");
  sheet.columns = [
    { header: "Received", key: "received", width: 12 },
    { header: "Name", key: "name", width: 24 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Country", key: "country", width: 16 },
    { header: "Tour", key: "tour", width: 32 },
    { header: "Destination", key: "destination", width: 20 },
    { header: "Group size", key: "groupSize", width: 11 },
    { header: "Source", key: "source", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Message", key: "message", width: 50 },
    { header: "Notes", key: "notes", width: 50 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const { lead, tour } of rows) {
    sheet.addRow({
      received: formatDate(lead.createdAt),
      name: lead.name ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      country: lead.country ?? "",
      tour: tour?.title ?? "",
      destination: lead.destination ?? "",
      groupSize: lead.groupSize ?? "",
      source: LEAD_SOURCE_LABELS[lead.source] ?? lead.source,
      status: LEAD_STATUS_LABELS[lead.status] ?? lead.status,
      message: lead.message ?? "",
      notes: lead.notes ?? "",
    });
  }
  sheet.getColumn("message").alignment = { wrapText: true, vertical: "top" };
  sheet.getColumn("notes").alignment = { wrapText: true, vertical: "top" };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
