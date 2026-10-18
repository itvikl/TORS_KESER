import "server-only";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import type { BlogPost, Review, SpecialOffer, Staff, Tour } from "@/lib/types";
import { adminDb, adminStorage } from "@/lib/firebase/admin";

/**
 * Two kinds of category share one id space:
 *  - "custom": created by staff, stored in `mediaCategories`.
 *  - "country": virtual, one per country any tour covers — id "country:<name>".
 * Both can be assigned manually (mediaAssets.categoryIds); country
 * categories additionally pick up every image used by a tour in that
 * country automatically, so tour photos sort themselves with no manual work.
 */
export type MediaCategoryKind = "custom" | "country";

export interface MediaCategory {
  id: string;
  name: string;
  kind: MediaCategoryKind;
  imageCount: number;
}

export interface MediaLibraryItem {
  url: string;
  /** Human-readable places the image is currently used, e.g. "Tour: Italy — gallery". Empty = uploaded but unused. */
  usedIn: string[];
  /** ISO timestamp — Storage upload time, when known (external/legacy URLs have none). */
  uploadedAt?: string;
  /** Categories staff assigned by hand — the only ones that can be removed. */
  manualCategoryIds: string[];
  /** Country categories derived from the tours that use this image. */
  autoCategoryIds: string[];
}

export interface MediaLibrary {
  items: MediaLibraryItem[];
  categories: MediaCategory[];
}

const CATEGORIES_COLLECTION = "mediaCategories";
/** One doc per image URL (id = sha1 of the URL — URLs are too long/slashy to be doc ids). */
const ASSETS_COLLECTION = "mediaAssets";
const COUNTRY_PREFIX = "country:";

/** Never offered for reuse — these are customers' private documents, not site imagery. */
const PRIVATE_STORAGE_PREFIXES = ["passport-scans/"];

export function countryCategoryId(country: string): string {
  return `${COUNTRY_PREFIX}${country}`;
}

export function isCountryCategoryId(id: string): boolean {
  return id.startsWith(COUNTRY_PREFIX);
}

function assetDocId(url: string): string {
  return createHash("sha1").update(url).digest("hex");
}

/**
 * Every image the admin can reuse: all files uploaded through
 * ImageUploadButton (Firebase Storage) merged with every image URL already
 * referenced by site content — which also covers legacy images hosted
 * outside our bucket (e.g. migrated from the old site). Deduped by URL;
 * newest uploads first, then used-but-external images.
 */
export async function getMediaLibrary(): Promise<MediaLibrary> {
  const items = new Map<string, MediaLibraryItem>();
  const ensure = (url: string | undefined): MediaLibraryItem | null => {
    const trimmed = url?.trim();
    if (!trimmed) return null;
    let item = items.get(trimmed);
    if (!item) {
      item = { url: trimmed, usedIn: [], manualCategoryIds: [], autoCategoryIds: [] };
      items.set(trimmed, item);
    }
    return item;
  };
  const add = (url: string | undefined, usage?: string, autoCategoryIds: string[] = []) => {
    const item = ensure(url);
    if (!item) return;
    if (usage && !item.usedIn.includes(usage)) item.usedIn.push(usage);
    for (const id of autoCategoryIds) {
      if (!item.autoCategoryIds.includes(id)) item.autoCategoryIds.push(id);
    }
  };

  const [
    storageFiles,
    toursSnap,
    blogSnap,
    offersSnap,
    reviewsSnap,
    staffSnap,
    categoriesSnap,
    assetsSnap,
  ] = await Promise.all([
    listStorageImages(),
    adminDb().collection("tours").get(),
    adminDb().collection("blogPosts").get(),
    adminDb().collection("specialOffers").get(),
    adminDb().collection("reviews").get(),
    adminDb().collection("staff").get(),
    adminDb().collection(CATEGORIES_COLLECTION).get(),
    adminDb().collection(ASSETS_COLLECTION).get(),
  ]);

  for (const { url, uploadedAt } of storageFiles) {
    const item = ensure(url);
    if (item) item.uploadedAt = uploadedAt;
  }

  const countries = new Set<string>();
  for (const doc of toursSnap.docs) {
    const tour = doc.data() as Tour;
    const tourCountries = tour.countries ?? [];
    tourCountries.forEach((country) => countries.add(country));
    const auto = tourCountries.map(countryCategoryId);
    add(tour.heroImage, `Tour: ${tour.title} — hero`, auto);
    for (const src of tour.gallery ?? []) add(src, `Tour: ${tour.title} — gallery`, auto);
    for (const day of tour.itineraryDays ?? []) {
      for (const src of day.images ?? []) {
        add(src, `Tour: ${tour.title} — day ${day.dayNumber}`, auto);
      }
    }
  }
  for (const doc of blogSnap.docs) {
    const post = doc.data() as BlogPost;
    add(post.heroImage, `Blog: ${post.title}`);
  }
  for (const doc of offersSnap.docs) {
    const offer = doc.data() as SpecialOffer;
    add(offer.image, `Offer: ${offer.title}`);
  }
  for (const doc of reviewsSnap.docs) {
    const review = doc.data() as Review;
    add(review.photo, `Review: ${review.customerName}`);
  }
  for (const doc of staffSnap.docs) {
    const staff = doc.data() as Staff;
    add(staff.photo, `Team: ${staff.name}`);
  }

  const customCategories = new Map(
    categoriesSnap.docs.map((doc) => [doc.id, (doc.data() as { name: string }).name])
  );

  // Manual assignments — skipped for images that no longer exist anywhere,
  // and dangling ids (deleted custom categories) are dropped.
  for (const doc of assetsSnap.docs) {
    const { url, categoryIds } = doc.data() as { url: string; categoryIds?: string[] };
    const item = items.get(url);
    if (!item) continue;
    item.manualCategoryIds = (categoryIds ?? []).filter((id) => {
      if (isCountryCategoryId(id)) {
        countries.add(id.slice(COUNTRY_PREFIX.length));
        return true;
      }
      return customCategories.has(id);
    });
  }

  // Only real image URLs/paths — guards against stray non-URL strings in old content.
  const list = Array.from(items.values())
    .filter((item) => /^(https?:\/\/|\/)/.test(item.url))
    .sort((a, b) => {
      if (a.uploadedAt && b.uploadedAt) return b.uploadedAt.localeCompare(a.uploadedAt);
      if (a.uploadedAt) return -1;
      if (b.uploadedAt) return 1;
      return a.url.localeCompare(b.url);
    });

  const countFor = (id: string) =>
    list.filter((item) => item.manualCategoryIds.includes(id) || item.autoCategoryIds.includes(id))
      .length;

  const categories: MediaCategory[] = [
    ...Array.from(customCategories, ([id, name]) => ({
      id,
      name,
      kind: "custom" as const,
      imageCount: countFor(id),
    })).sort((a, b) => a.name.localeCompare(b.name)),
    ...Array.from(countries)
      .sort((a, b) => a.localeCompare(b))
      .map((country) => {
        const id = countryCategoryId(country);
        return { id, name: country, kind: "country" as const, imageCount: countFor(id) };
      }),
  ];

  return { items: list, categories };
}

/**
 * True when a custom category or a tour country already uses this name
 * (case-insensitive). Reads only category names and tour countries, not the
 * whole library.
 */
export async function mediaCategoryNameTaken(name: string, exceptId?: string): Promise<boolean> {
  const wanted = name.trim().toLowerCase();
  const [categoriesSnap, toursSnap] = await Promise.all([
    adminDb().collection(CATEGORIES_COLLECTION).select("name").get(),
    adminDb().collection("tours").select("countries").get(),
  ]);
  const customTaken = categoriesSnap.docs.some(
    (doc) =>
      doc.id !== exceptId &&
      String((doc.data() as { name?: string }).name ?? "").toLowerCase() === wanted
  );
  if (customTaken) return true;
  return toursSnap.docs.some((doc) =>
    ((doc.data() as { countries?: string[] }).countries ?? []).some(
      (country) => country.toLowerCase() === wanted
    )
  );
}

export async function createMediaCategoryDoc(name: string): Promise<string> {
  const ref = adminDb().collection(CATEGORIES_COLLECTION).doc();
  await ref.set({ categoryId: ref.id, name, createdAt: new Date().toISOString() });
  return ref.id;
}

export async function renameMediaCategoryDoc(categoryId: string, name: string): Promise<void> {
  await adminDb().collection(CATEGORIES_COLLECTION).doc(categoryId).update({ name });
}

/** Images stay in the library — only the category and its assignments go. */
export async function deleteMediaCategoryDoc(categoryId: string): Promise<void> {
  const assigned = await adminDb()
    .collection(ASSETS_COLLECTION)
    .where("categoryIds", "array-contains", categoryId)
    .get();
  // Firestore caps a batch at 500 writes — chunk the unassignments, then
  // delete the category itself last so a partial failure leaves it visible.
  const BATCH_LIMIT = 450;
  for (let i = 0; i < assigned.docs.length; i += BATCH_LIMIT) {
    const batch = adminDb().batch();
    assigned.docs
      .slice(i, i + BATCH_LIMIT)
      .forEach((doc) => batch.update(doc.ref, { categoryIds: FieldValue.arrayRemove(categoryId) }));
    await batch.commit();
  }
  await adminDb().collection(CATEGORIES_COLLECTION).doc(categoryId).delete();
}

export async function mediaCategoryExists(categoryId: string): Promise<boolean> {
  if (isCountryCategoryId(categoryId)) return categoryId.length > COUNTRY_PREFIX.length;
  const doc = await adminDb().collection(CATEGORIES_COLLECTION).doc(categoryId).get();
  return doc.exists;
}

/** Adds/removes one manual category on many images at once. */
export async function setImagesCategoryDoc(
  urls: string[],
  categoryId: string,
  assigned: boolean
): Promise<void> {
  const batch = adminDb().batch();
  for (const url of urls) {
    batch.set(
      adminDb().collection(ASSETS_COLLECTION).doc(assetDocId(url)),
      {
        url,
        categoryIds: assigned
          ? FieldValue.arrayUnion(categoryId)
          : FieldValue.arrayRemove(categoryId),
      },
      { merge: true }
    );
  }
  await batch.commit();
}

/** Builds the same tokenized download URL uploadImage() returns, so the two dedupe against each other. */
async function listStorageImages(): Promise<{ url: string; uploadedAt?: string }[]> {
  const bucket = adminStorage().bucket();
  const [files] = await bucket.getFiles();

  return files.flatMap((file) => {
    if (PRIVATE_STORAGE_PREFIXES.some((prefix) => file.name.startsWith(prefix))) return [];
    if (!String(file.metadata.contentType ?? "").startsWith("image/")) return [];

    const tokens = file.metadata.metadata?.firebaseStorageDownloadTokens;
    const token = typeof tokens === "string" ? tokens.split(",")[0] : undefined;
    if (!token) return [];

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      file.name
    )}?alt=media&token=${token}`;
    return [{ url, uploadedAt: file.metadata.timeCreated }];
  });
}
