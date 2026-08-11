import "server-only";
import type { Review, Tour } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";

export interface ApprovedReview {
  review: Review;
  tour?: Tour;
}

/** Public counterpart of lib/data/admin/reviews.ts's getAllReviewsAdmin — only reviews staff have approved via /admin/reviews are shown on /testimonials. */
export async function getApprovedReviews(): Promise<ApprovedReview[]> {
  const [reviewsSnap, toursSnap] = await Promise.all([
    adminDb().collection("reviews").where("status", "==", "approved").get(),
    adminDb().collection("tours").get(),
  ]);

  const tourById = new Map(toursSnap.docs.map((doc) => [doc.id, doc.data() as Tour]));

  return reviewsSnap.docs.map((doc) => {
    const review = doc.data() as Review;
    return { review, tour: tourById.get(review.tourId) };
  });
}
