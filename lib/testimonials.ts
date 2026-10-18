import type { Review, Tour } from "@/lib/types";

/** Firestore collection of per-destination settings (TestimonialDestination). */
export const TESTIMONIAL_DESTINATIONS_COLLECTION = "testimonialDestinations";

/**
 * Anchor/doc id for a destination: "Spain & Portugal" → "spain-portugal".
 * Matches the old site's /testemonials-<slug>/ URLs, so their redirects can
 * land on /testimonials#<slug>.
 */
export function destinationSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The group a review is shown under on /testimonials. */
export function reviewDestination(review: Review, tour?: Tour): string {
  return review.destination?.trim() || tour?.countries?.[0] || "Other destinations";
}

/**
 * Whether a review belongs on a tour's page. A review with a destination
 * shows on every tour visiting a country it names ("Spain & Portugal" →
 * Spain and Portugal tours); without one, only on its own tour.
 */
export function reviewMatchesTour(review: Review, tour: Tour): boolean {
  const destination = review.destination?.trim().toLowerCase();
  if (!destination) return review.tourId === tour.tourId;
  return (tour.countries ?? []).some((country) => destination.includes(country.toLowerCase()));
}
