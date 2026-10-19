import "server-only";
import type { Tour, TourStatus } from "@/lib/types";
import type { TourInput } from "@/lib/validation/tour";
import { adminDb } from "@/lib/firebase/admin";
import { bySortOrder } from "@/lib/tourSort";

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

/**
 * Docs missing sortOrder (pre-migration) are excluded by this orderBy, so
 * this can under-count until the backfill script runs — harmless, since a
 * collision just means a couple of tours share a low sortOrder until the
 * next drag-and-drop reorder, and every *display* sort (lib/tourSort.ts)
 * falls back to alphabetical for docs without the field regardless.
 */
async function getNextSortOrder(): Promise<number> {
  const snapshot = await adminDb()
    .collection(TOURS_COLLECTION)
    .orderBy("sortOrder", "desc")
    .limit(1)
    .get();
  const top = snapshot.docs[0]?.data() as Tour | undefined;
  return (top?.sortOrder ?? -1) + 1;
}

export async function createTourDoc(input: TourInput): Promise<string> {
  const ref = adminDb().collection(TOURS_COLLECTION).doc();
  const tour: Tour = {
    ...input,
    tourId: ref.id,
    slugHistory: [],
    sortOrder: await getNextSortOrder(),
  };
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

  // .set() below fully overwrites the doc — sortOrder must be carried
  // forward explicitly or every routine edit would silently reset a tour's
  // manual position back to "no sortOrder" (same class of bug slugHistory
  // above already guards against).
  const sortOrder = previous?.sortOrder ?? (await getNextSortOrder());

  const tour: Tour = { ...input, tourId, slugHistory, sortOrder };
  await ref.set(tour);
  return tourId;
}

/**
 * Copies a tour's content into a new draft (no departures — those carry
 * bookings/capacity, so staff add fresh dates to the copy themselves).
 * The slug gets a "-copy" suffix, numbered until it's free, since slugs
 * must stay unique (isSlugTaken).
 */
export async function duplicateTourDoc(tourId: string): Promise<string | null> {
  const source = await getTourByIdAdmin(tourId);
  if (!source) return null;

  let slug = `${source.slug}-copy`;
  for (let n = 2; await isSlugTaken(slug); n++) slug = `${source.slug}-copy-${n}`;

  const ref = adminDb().collection(TOURS_COLLECTION).doc();
  const copy: Tour = {
    ...source,
    tourId: ref.id,
    slug,
    slugHistory: [],
    title: `${source.title} (Copy)`,
    status: "draft",
  };

  // Place the copy directly under its original in the admin list, rather
  // than at "max sortOrder + 1" — with many tours still lacking a sortOrder
  // (sorted alphabetically after the ordered ones), that put copies far
  // from the original and staff couldn't find them. Rewriting every tour's
  // sortOrder from the current display order keeps everyone else's
  // relative position unchanged.
  const ordered = (await getAllToursAdmin()).sort(bySortOrder);
  const sourceIndex = ordered.findIndex((t) => t.tourId === tourId);
  ordered.splice(sourceIndex + 1, 0, copy);

  const batch = adminDb().batch();
  ordered.forEach((tour, index) => {
    const tourRef = adminDb().collection(TOURS_COLLECTION).doc(tour.tourId);
    if (tour.tourId === copy.tourId) batch.set(tourRef, { ...copy, sortOrder: index });
    else if (tour.sortOrder !== index) batch.update(tourRef, { sortOrder: index });
  });
  await batch.commit();
  return ref.id;
}

/** Batch update of display order from a drag-and-drop reorder in the admin tours list. */
export async function setTourSortOrders(orderedTourIds: string[]): Promise<void> {
  const batch = adminDb().batch();
  orderedTourIds.forEach((tourId, index) => {
    batch.update(adminDb().collection(TOURS_COLLECTION).doc(tourId), { sortOrder: index });
  });
  await batch.commit();
}

/** FR-43: no raw delete from the editor — only archive (stays resolvable) or, later, an explicit redirect. */
export async function archiveTourDoc(tourId: string): Promise<void> {
  await adminDb().collection(TOURS_COLLECTION).doc(tourId).update({ status: "archived" });
}

export async function setTourStatusDoc(tourId: string, status: TourStatus): Promise<void> {
  await adminDb().collection(TOURS_COLLECTION).doc(tourId).update({ status });
}
