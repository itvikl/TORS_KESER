import "server-only";
import type { Tour, TourStatus } from "@/lib/types";
import type { TourInput } from "@/lib/validation/tour";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Admin-facing tours data layer — unlike lib/data/tours.ts (public site,
 * published-only), these reads return every status so staff can see and
 * manage drafts/archived tours (PRD FR-24, FR-45).
 */
const TOURS_COLLECTION = "tours";

export async function getAllToursAdmin(): Promise<Tour[]> {
  const snapshot = await adminDb().collection(TOURS_COLLECTION).get();
  return snapshot.docs.map((doc) => doc.data() as Tour);
}

export async function getTourByIdAdmin(tourId: string): Promise<Tour | null> {
  const doc = await adminDb().collection(TOURS_COLLECTION).doc(tourId).get();
  return doc.exists ? (doc.data() as Tour) : null;
}

export async function isSlugTaken(slug: string, excludeTourId?: string): Promise<boolean> {
  const snapshot = await adminDb()
    .collection(TOURS_COLLECTION)
    .where("slug", "==", slug)
    .get();
  return snapshot.docs.some((doc) => doc.id !== excludeTourId);
}

export async function createTourDoc(input: TourInput): Promise<string> {
  const ref = adminDb().collection(TOURS_COLLECTION).doc();
  const tour: Tour = { ...input, tourId: ref.id, slugHistory: [] };
  await ref.set(tour);
  return ref.id;
}

/**
 * Slug changes (FR-42/FR-44) get appended to slugHistory rather than lost —
 * the public route resolver is expected to fall back to slugHistory so an
 * edited slug 301s instead of 404ing (not built yet; this just preserves
 * the data the resolver will need).
 */
export async function updateTourDoc(tourId: string, input: TourInput): Promise<string> {
  const ref = adminDb().collection(TOURS_COLLECTION).doc(tourId);
  const existing = await ref.get();
  const previous = existing.data() as Tour | undefined;

  const slugHistory =
    previous && previous.slug !== input.slug
      ? Array.from(new Set([...(previous.slugHistory ?? []), previous.slug]))
      : (previous?.slugHistory ?? []);

  const tour: Tour = { ...input, tourId, slugHistory };
  await ref.set(tour);
  return tourId;
}

/** FR-43: no raw delete from the editor — only archive (stays resolvable) or, later, an explicit redirect. */
export async function archiveTourDoc(tourId: string): Promise<void> {
  await adminDb().collection(TOURS_COLLECTION).doc(tourId).update({ status: "archived" });
}

export async function setTourStatusDoc(tourId: string, status: TourStatus): Promise<void> {
  await adminDb().collection(TOURS_COLLECTION).doc(tourId).update({ status });
}
