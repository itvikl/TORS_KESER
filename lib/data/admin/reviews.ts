import "server-only";
import type { Review } from "@/lib/types";
import type { ReviewInput } from "@/lib/validation/review";
import { adminDb } from "@/lib/firebase/admin";

const REVIEWS_COLLECTION = "reviews";

export async function getAllReviewsAdmin(): Promise<Review[]> {
  const snapshot = await adminDb().collection(REVIEWS_COLLECTION).get();
  return snapshot.docs.map((doc) => doc.data() as Review);
}

export async function createReviewDoc(input: ReviewInput): Promise<string> {
  const ref = adminDb().collection(REVIEWS_COLLECTION).doc();
  const review: Review = { ...input, reviewId: ref.id };
  await ref.set(review);
  return ref.id;
}

export async function setReviewStatusDoc(reviewId: string, status: Review["status"]): Promise<void> {
  await adminDb().collection(REVIEWS_COLLECTION).doc(reviewId).update({ status });
}
