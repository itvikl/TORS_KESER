import "server-only";
import type { Review } from "@/lib/types";
import type { ReviewInput } from "@/lib/validation/review";
import { adminDb } from "@/lib/firebase/admin";

const REVIEWS_COLLECTION = "reviews";

export async function getAllReviewsAdmin(): Promise<Review[]> {
  const snapshot = await adminDb().collection(REVIEWS_COLLECTION).get();
  return snapshot.docs.map((doc) => doc.data() as Review);
}

export async function getReviewByIdAdmin(reviewId: string): Promise<Review | null> {
  const doc = await adminDb().collection(REVIEWS_COLLECTION).doc(reviewId).get();
  return doc.exists ? (doc.data() as Review) : null;
}

export async function createReviewDoc(input: ReviewInput): Promise<string> {
  const ref = adminDb().collection(REVIEWS_COLLECTION).doc();
  const review: Review = { ...input, reviewId: ref.id };
  await ref.set(review);
  return ref.id;
}

/**
 * Full overwrite of an existing review, keeping its id. Needed for the
 * testimonials migrated from the old site (scripts/migrate-legacy-testimonials.ts),
 * where the customer name was extracted from a letter's signature line and
 * often needs cleaning up by hand.
 */
export async function updateReviewDoc(reviewId: string, input: ReviewInput): Promise<string> {
  const review: Review = { ...input, reviewId };
  await adminDb().collection(REVIEWS_COLLECTION).doc(reviewId).set(review);
  return reviewId;
}

export async function setReviewStatusDoc(reviewId: string, status: Review["status"]): Promise<void> {
  await adminDb().collection(REVIEWS_COLLECTION).doc(reviewId).update({ status });
}
