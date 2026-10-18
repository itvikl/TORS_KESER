import "server-only";
import type { Review, TestimonialDestination, Tour } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";
import {
  TESTIMONIAL_DESTINATIONS_COLLECTION,
  destinationSlug,
  reviewDestination,
  reviewMatchesTour,
} from "@/lib/testimonials";

export interface ApprovedReview {
  review: Review;
  tour?: Tour;
}

export interface TestimonialGroup {
  slug: string;
  name: string;
  /** Destination photo: staff's pick, else the most-reviewed tour's hero, else a review photo. */
  image?: string;
  reviews: ApprovedReview[];
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

/** /testimonials, grouped by destination like the old site; groups A–Z, reviews with photos first. */
export async function getTestimonialGroups(): Promise<TestimonialGroup[]> {
  const [reviews, destinationsSnap] = await Promise.all([
    getApprovedReviews(),
    adminDb().collection(TESTIMONIAL_DESTINATIONS_COLLECTION).get(),
  ]);
  const settings = new Map(
    destinationsSnap.docs.map((doc) => [doc.id, doc.data() as TestimonialDestination])
  );

  const groups = new Map<string, TestimonialGroup>();
  for (const entry of reviews) {
    const name = reviewDestination(entry.review, entry.tour);
    const slug = destinationSlug(name);
    const group = groups.get(slug) ?? { slug, name, reviews: [] };
    group.reviews.push(entry);
    groups.set(slug, group);
  }

  for (const group of groups.values()) {
    group.reviews.sort((a, b) => Number(Boolean(b.review.photo)) - Number(Boolean(a.review.photo)));
    group.image = settings.get(group.slug)?.image || defaultGroupImage(group.reviews);
  }

  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function defaultGroupImage(reviews: ApprovedReview[]): string | undefined {
  const tourCounts = new Map<string, { tour: Tour; count: number }>();
  for (const { tour } of reviews) {
    if (!tour?.heroImage) continue;
    const entry = tourCounts.get(tour.tourId) ?? { tour, count: 0 };
    entry.count++;
    tourCounts.set(tour.tourId, entry);
  }
  const topTour = Array.from(tourCounts.values()).sort((a, b) => b.count - a.count)[0]?.tour;
  return topTour?.heroImage || reviews.find(({ review }) => review.photo)?.review.photo;
}

/** Approved reviews for a tour page (see reviewMatchesTour), photos first. */
export async function getApprovedReviewsForTour(tour: Tour): Promise<Review[]> {
  const snap = await adminDb().collection("reviews").where("status", "==", "approved").get();
  return snap.docs
    .map((doc) => doc.data() as Review)
    .filter((review) => reviewMatchesTour(review, tour))
    .sort((a, b) => Number(Boolean(b.photo)) - Number(Boolean(a.photo)));
}
