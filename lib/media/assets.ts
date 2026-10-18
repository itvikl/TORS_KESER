import { createHash } from "node:crypto";
import type { BlogPost, Review, SpecialOffer, Staff, Tour } from "@/lib/types";

/**
 * Shared (non-server-only) pieces of the image library index, so
 * scripts/migrate/index-media-library.ts and the app write identical docs.
 *
 * `mediaAssets` holds one doc per image in our Storage bucket (id = sha1 of
 * the storage path, so the same file under two download tokens is one
 * entry). Categories, countries and "used in" all live on that doc — the
 * library never scans site content or lists the bucket at read time.
 */

export const ASSETS_COLLECTION = "mediaAssets";
export const CATEGORIES_COLLECTION = "mediaCategories";
export const COUNTRY_PREFIX = "country:";

/** Never indexed — customers' private documents, not site imagery. */
export const PRIVATE_STORAGE_PREFIXES = ["passport-scans/"];

/** Content collections whose image fields feed the library's "used in" + countries. */
export const CONTENT_COLLECTIONS = ["tours", "blogPosts", "specialOffers", "reviews", "staff"] as const;
export type ContentCollection = (typeof CONTENT_COLLECTIONS)[number];

export interface MediaUsage {
  /** e.g. "Tour: Italy — gallery" — one per place in that doc the image appears. */
  labels: string[];
  /** Countries of the using tour; drives the automatic country categories. */
  countries: string[];
}

export interface MediaAssetDoc {
  url: string;
  storagePath: string;
  /** ISO — Storage upload time (or index time when unknown). */
  uploadedAt: string;
  /** Categories assigned by hand — the only ones staff can remove. */
  categoryIds: string[];
  /** Keyed by "<collection>/<docId>". */
  usages: Record<string, MediaUsage>;
  /** Object.keys(usages) — queryable with array-contains. */
  usageKeys: string[];
  /** Country categories derived from usages. */
  autoCategoryIds: string[];
  /** categoryIds ∪ autoCategoryIds — what category browsing queries. */
  allCategoryIds: string[];
}

export function countryCategoryId(country: string): string {
  // "/" can't appear in a Firestore doc id.
  return `${COUNTRY_PREFIX}${country.replace(/\//g, "-")}`;
}

export function isCountryCategoryId(id: string): boolean {
  return id.startsWith(COUNTRY_PREFIX);
}

export function assetDocId(storagePath: string): string {
  return createHash("sha1").update(storagePath).digest("hex");
}

export function storageDownloadUrl(bucketName: string, storagePath: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    storagePath
  )}?alt=media&token=${token}`;
}

/** Storage path of a download URL into `bucketName`, or null for anything else (external, other bucket, private). */
export function libraryStoragePath(url: string | undefined, bucketName: string): string | null {
  const match = url
    ?.trim()
    .match(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^?#]+)/);
  if (!match || match[1] !== bucketName) return null;
  let path: string;
  try {
    path = decodeURIComponent(match[2]);
  } catch {
    return null;
  }
  if (PRIVATE_STORAGE_PREFIXES.some((prefix) => path.startsWith(prefix))) return null;
  return path;
}

/** Recomputes the derived fields after usages/categoryIds change. */
export function finalizeAsset(doc: MediaAssetDoc): MediaAssetDoc {
  const autoCategoryIds = Array.from(
    new Set(Object.values(doc.usages).flatMap((u) => u.countries.map(countryCategoryId)))
  ).sort();
  const categoryIds = Array.from(new Set(doc.categoryIds));
  return {
    ...doc,
    categoryIds,
    usageKeys: Object.keys(doc.usages).sort(),
    autoCategoryIds,
    allCategoryIds: Array.from(new Set([...categoryIds, ...autoCategoryIds])).sort(),
  };
}

export function newAssetDoc(url: string, storagePath: string, uploadedAt: string): MediaAssetDoc {
  return finalizeAsset({
    url,
    storagePath,
    uploadedAt,
    categoryIds: [],
    usages: {},
    usageKeys: [],
    autoCategoryIds: [],
    allCategoryIds: [],
  });
}

export interface ContentImages {
  /** Every image reference in the doc, with where it appears. */
  images: { url: string; label: string }[];
  countries: string[];
}

/** The image fields of one content doc — the single list both the app and the migration read. */
export function contentImages(collection: ContentCollection, data: unknown): ContentImages {
  const images: { url: string; label: string }[] = [];
  const add = (url: string | undefined, label: string) => {
    const trimmed = url?.trim();
    if (trimmed) images.push({ url: trimmed, label });
  };

  switch (collection) {
    case "tours": {
      const tour = data as Tour;
      add(tour.heroImage, `Tour: ${tour.title} — hero`);
      for (const src of tour.gallery ?? []) add(src, `Tour: ${tour.title} — gallery`);
      for (const day of tour.itineraryDays ?? []) {
        for (const src of day.images ?? []) add(src, `Tour: ${tour.title} — day ${day.dayNumber}`);
      }
      return { images, countries: tour.countries ?? [] };
    }
    case "blogPosts": {
      const post = data as BlogPost;
      add(post.heroImage, `Blog: ${post.title}`);
      break;
    }
    case "specialOffers": {
      const offer = data as SpecialOffer;
      add(offer.image, `Offer: ${offer.title}`);
      break;
    }
    case "reviews": {
      const review = data as Review;
      add(review.photo, `Review: ${review.customerName}`);
      break;
    }
    case "staff": {
      const staff = data as Staff;
      add(staff.photo, `Team: ${staff.name}`);
      break;
    }
  }
  return { images, countries: [] };
}

/**
 * Field-level patch that swaps image URLs per `replace` (old → new), for the
 * migration's copy-external-images-into-the-bucket step. Returns null when
 * nothing in the doc changes.
 */
export function replaceContentImages(
  collection: ContentCollection,
  data: unknown,
  replace: (url: string) => string
): Record<string, unknown> | null {
  const swap = (url: string | undefined) => (url?.trim() ? replace(url.trim()) : url);
  const patch: Record<string, unknown> = {};
  const set = (field: string, before: unknown, after: unknown) => {
    if (JSON.stringify(before) !== JSON.stringify(after)) patch[field] = after;
  };

  switch (collection) {
    case "tours": {
      const tour = data as Tour;
      set("heroImage", tour.heroImage, swap(tour.heroImage));
      if (tour.gallery) set("gallery", tour.gallery, tour.gallery.map((src) => swap(src)));
      if (tour.itineraryDays) {
        set(
          "itineraryDays",
          tour.itineraryDays,
          tour.itineraryDays.map((day) =>
            day.images ? { ...day, images: day.images.map((src) => swap(src)) } : day
          )
        );
      }
      break;
    }
    case "blogPosts":
      set("heroImage", (data as BlogPost).heroImage, swap((data as BlogPost).heroImage));
      break;
    case "specialOffers":
      set("image", (data as SpecialOffer).image, swap((data as SpecialOffer).image));
      break;
    case "reviews":
      set("photo", (data as Review).photo, swap((data as Review).photo));
      break;
    case "staff":
      set("photo", (data as Staff).photo, swap((data as Staff).photo));
      break;
  }
  return Object.keys(patch).length ? patch : null;
}
