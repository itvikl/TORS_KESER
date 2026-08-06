import "server-only";
import type { SpecialOffer } from "@/lib/types";
import type { OfferInput } from "@/lib/validation/offer";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Admin-facing offers data layer — unlike lib/data/offers.ts (public site,
 * published-only), these reads return drafts too. Same "specialOffers"
 * collection, kept consistent with the public reader.
 */
const OFFERS_COLLECTION = "specialOffers";

export async function getAllOffersAdmin(): Promise<SpecialOffer[]> {
  const snapshot = await adminDb().collection(OFFERS_COLLECTION).get();
  return snapshot.docs.map((doc) => doc.data() as SpecialOffer);
}

export async function getOfferByIdAdmin(offerId: string): Promise<SpecialOffer | null> {
  const doc = await adminDb().collection(OFFERS_COLLECTION).doc(offerId).get();
  return doc.exists ? (doc.data() as SpecialOffer) : null;
}

export async function createOfferDoc(input: OfferInput): Promise<string> {
  const ref = adminDb().collection(OFFERS_COLLECTION).doc();
  const offer: SpecialOffer = { ...input, offerId: ref.id };
  await ref.set(offer);
  return ref.id;
}

export async function updateOfferDoc(offerId: string, input: OfferInput): Promise<string> {
  const ref = adminDb().collection(OFFERS_COLLECTION).doc(offerId);
  const offer: SpecialOffer = { ...input, offerId };
  await ref.set(offer);
  return offerId;
}
