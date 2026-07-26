import type { SpecialOffer } from "@/lib/types";

// Empty on purpose: the existing site's Special Offers page is stale
// (last updated 2018). The new admin panel (PRD FR-31) lets staff
// publish offers without a developer — this stays empty until they do.
const OFFERS: SpecialOffer[] = [];

export async function getSpecialOffers(): Promise<SpecialOffer[]> {
  return OFFERS.filter((o) => o.status === "published");
}
