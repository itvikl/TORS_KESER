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

export type CountryAvailability = "available" | "sold_out" | "unavailable";

export interface CountryOption {
  name: string;
  availability: CountryAvailability;
}

/**
 * All countries actually tagged on a published tour, with availability for
 * the homepage dropdown. Unlike the old fixed continent list, this is
 * derived from real tour data — a country only appears here if some tour
 * goes there. Available countries are selectable; others are shown
 * disabled with a reason.
 *
 * Fetches all published tours and all departures (rather than a query per
 * country) — both collections are small, so this stays a single round trip
 * to Firestore.
 */
export async function getCountrySearchOptions(): Promise<CountryOption[]> {
  const [tours, departures] = await Promise.all([
    getAllTours(),
    adminDb()
      .collection(DEPARTURES_COLLECTION)
      .get()
      .then((snapshot) => snapshot.docs.map((doc) => doc.data() as Departure)),
  ]);

  const countryNames = [...new Set(tours.flatMap((t) => t.countries))].sort();

  return countryNames.map((name) => {
    const toursForCountry = tours.filter((t) => t.countries.includes(name));
    const countryDepartures = departures.filter((d) =>
      toursForCountry.some((t) => t.tourId === d.tourId)
    );

    if (countryDepartures.some(isDepartureBookable)) {
      return { name, availability: "available" as const };
    }

    const future = countryDepartures.filter(isDeparturePlanned);
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
