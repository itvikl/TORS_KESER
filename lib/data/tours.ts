import "server-only";
import type { Departure, Tour } from "@/lib/types";
import { availableSeats } from "@/lib/types";
import { isDepartureBookable, isDeparturePlanned } from "@/lib/departureAvailability";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Firestore-backed data layer for tours/departures. Reads go through the
 * admin SDK (server-only) rather than the client SDK — these pages are all
 * Server Components, and the admin SDK avoids needing public Firestore
 * security rules just to list published tours.
 *
 * Seed content lives in lib/data/seed/tours.seed.ts and is pushed via
 * `npm run seed` (scripts/seed-firestore.ts).
 */

const TOURS_COLLECTION = "tours";
const DEPARTURES_COLLECTION = "departures";

export async function getAllTours(): Promise<Tour[]> {
  const snapshot = await adminDb()
    .collection(TOURS_COLLECTION)
    .where("status", "==", "published")
    .get();
  return snapshot.docs.map((doc) => doc.data() as Tour);
}

/**
 * Public lookup by slug — used by the tour detail page and the booking
 * page. Draft tours are excluded (they're work-in-progress and shouldn't
 * be reachable by a guessed/shared URL before publish); archived tours are
 * still returned so old links keep resolving instead of 404ing.
 */
export async function getTourBySlug(slug: string): Promise<Tour | null> {
  const snapshot = await adminDb()
    .collection(TOURS_COLLECTION)
    .where("slug", "==", slug)
    .limit(1)
    .get();
  const doc = snapshot.docs[0];
  if (!doc) return null;
  const tour = doc.data() as Tour;
  return tour.status === "draft" ? null : tour;
}

export async function getDeparturesForTour(tourId: string): Promise<Departure[]> {
  // Sorted in memory (rather than orderBy in the query) so this doesn't
  // need a composite Firestore index — departure counts per tour are small.
  const snapshot = await adminDb()
    .collection(DEPARTURES_COLLECTION)
    .where("tourId", "==", tourId)
    .get();
  return snapshot.docs
    .map((doc) => doc.data() as Departure)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

/** Published tours flagged as a special offer in the admin tour editor. */
export async function getSpecialOfferTours(): Promise<Tour[]> {
  const tours = await getAllTours();
  return tours.filter((tour) => tour.isSpecialOffer);
}

export async function getFeaturedTours(limit = 4): Promise<Tour[]> {
  const snapshot = await adminDb()
    .collection(TOURS_COLLECTION)
    .where("status", "==", "published")
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => doc.data() as Tour);
}

export type RegionAvailability = "available" | "sold_out" | "unavailable";

export interface RegionOption {
  name: string;
  availability: RegionAvailability;
}

/** Canonical region list shown in the homepage search. */
const SEARCH_REGIONS = [
  "Asia & Far East",
  "South America",
  "Europe",
  "Africa",
  "North America",
  "South Pacific",
] as const;

/**
 * All search regions with availability for the homepage dropdown.
 * Available regions are selectable; others are shown disabled with a reason.
 *
 * Fetches all published tours and all departures (rather than a query per
 * region) — both collections are small, so this stays a single round trip
 * to Firestore instead of up to six.
 */
export async function getRegionSearchOptions(): Promise<RegionOption[]> {
  const [tours, departures] = await Promise.all([
    getAllTours(),
    adminDb()
      .collection(DEPARTURES_COLLECTION)
      .get()
      .then((snapshot) => snapshot.docs.map((doc) => doc.data() as Departure)),
  ]);

  return SEARCH_REGIONS.map((name) => {
    const toursInRegion = tours.filter((t) => t.region === name);
    const regionDepartures = departures.filter((d) =>
      toursInRegion.some((t) => t.tourId === d.tourId)
    );

    if (regionDepartures.some(isDepartureBookable)) {
      return { name, availability: "available" as const };
    }

    const future = regionDepartures.filter(isDeparturePlanned);
    if (
      future.length > 0 &&
      future.every(
        (d) =>
          d.status === "soldout" ||
          (d.status === "open" && availableSeats(d) <= 0)
      )
    ) {
      return { name, availability: "sold_out" as const };
    }

    return { name, availability: "unavailable" as const };
  });
}
