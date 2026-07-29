import "server-only";
import type { SpecialOffer } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";

const OFFERS_COLLECTION = "specialOffers";

export async function getSpecialOffers(): Promise<SpecialOffer[]> {
  const snapshot = await adminDb()
    .collection(OFFERS_COLLECTION)
    .where("status", "==", "published")
    .get();
  return snapshot.docs.map((doc) => doc.data() as SpecialOffer);
}
