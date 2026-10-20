import "server-only";
import type { Lead, Tour } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";
import { isInDateRange, type DateRangeFilter } from "@/lib/dateRangeFilter";

const LEADS_COLLECTION = "leads";

export interface AdminLeadRow {
  lead: Lead;
  tour?: Tour;
}

/**
 * Joins leads with their referenced tour in memory, same pattern as lib/data/admin/bookings.ts.
 * `filter` bounds the lead's createdAt date (inclusive).
 */
export async function getAllLeadsAdmin(filter: DateRangeFilter = {}): Promise<AdminLeadRow[]> {
  const [leadsSnap, toursSnap] = await Promise.all([
    adminDb().collection(LEADS_COLLECTION).get(),
    adminDb().collection("tours").get(),
  ]);

  const tourById = new Map(toursSnap.docs.map((doc) => [doc.id, doc.data() as Tour]));

  const rows: AdminLeadRow[] = leadsSnap.docs
    .map((doc) => doc.data() as Lead)
    .filter((lead) => isInDateRange(lead.createdAt, filter))
    .map((lead) => ({ lead, tour: lead.tourId ? tourById.get(lead.tourId) : undefined }));

  rows.sort((a, b) => b.lead.createdAt.localeCompare(a.lead.createdAt));
  return rows;
}

export async function getLeadByIdAdmin(leadId: string): Promise<Lead | null> {
  const doc = await adminDb().collection(LEADS_COLLECTION).doc(leadId).get();
  return doc.exists ? (doc.data() as Lead) : null;
}
