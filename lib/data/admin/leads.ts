import "server-only";
import type { Lead, Tour } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";

const LEADS_COLLECTION = "leads";

export interface AdminLeadRow {
  lead: Lead;
  tour?: Tour;
}

/** Joins leads with their referenced tour in memory, same pattern as lib/data/admin/bookings.ts. */
export async function getAllLeadsAdmin(): Promise<AdminLeadRow[]> {
  const [leadsSnap, toursSnap] = await Promise.all([
    adminDb().collection(LEADS_COLLECTION).get(),
    adminDb().collection("tours").get(),
  ]);

  const tourById = new Map(toursSnap.docs.map((doc) => [doc.id, doc.data() as Tour]));

  const rows: AdminLeadRow[] = leadsSnap.docs.map((doc) => {
    const lead = doc.data() as Lead;
    return { lead, tour: lead.tourId ? tourById.get(lead.tourId) : undefined };
  });

  rows.sort((a, b) => b.lead.createdAt.localeCompare(a.lead.createdAt));
  return rows;
}
