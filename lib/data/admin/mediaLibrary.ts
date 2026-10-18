import "server-only";
import { FieldValue, type DocumentReference, type Query, type WriteBatch } from "firebase-admin/firestore";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import {
  ASSETS_COLLECTION,
  CATEGORIES_COLLECTION,
  assetDocId,
  contentImages,
  countryCategoryId,
  finalizeAsset,
  isCountryCategoryId,
  libraryStoragePath,
  newAssetDoc,
  type ContentCollection,
  type MediaAssetDoc,
} from "@/lib/media/assets";

/**
 * The image library reads only the `mediaAssets` index (see
 * lib/media/assets.ts). Uploads add to it (lib/actions/uploads.ts), content
 * saves keep its "used in" + country categories current (syncContentMedia),
 * and scripts/migrate/index-media-library.ts built it from what already
 * existed. Two kinds of category share one id space, both stored as docs in
 * `mediaCategories`:
 *  - "custom": created by staff.
 *  - "country": "country:<name>", one per tour country; tour images join it
 *    automatically.
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
  /** Human-readable places the image is used, e.g. "Tour: Italy — gallery". Empty = uploaded but unused. */
  usedIn: string[];
  uploadedAt: string;
  /** Categories staff assigned by hand — the only ones that can be removed. */
  manualCategoryIds: string[];
  /** Country categories derived from the tours that use this image. */
  autoCategoryIds: string[];
}

export interface MediaCategoryList {
  categories: MediaCategory[];
  totalCount: number;
  uncategorizedCount: number;
}

export interface MediaPage {
  items: MediaLibraryItem[];
  /** Pass back to get the next page; null = no more. */
  nextCursor: string | null;
}

/** Pseudo-categories the browser can ask for alongside real ones. */
export const ALL_MEDIA = "__all";
export const UNCATEGORIZED_MEDIA = "__uncategorized";

const PAGE_SIZE = 48;
const BATCH_LIMIT = 450;

function assets() {
  return adminDb().collection(ASSETS_COLLECTION);
}

function categoriesCol() {
  return adminDb().collection(CATEGORIES_COLLECTION);
}

function bucketName(): string {
  return adminStorage().bucket().name;
}

function toItem(doc: MediaAssetDoc): MediaLibraryItem {
  return {
    url: doc.url,
    usedIn: Object.values(doc.usages ?? {}).flatMap((u) => u.labels),
    uploadedAt: doc.uploadedAt,
    manualCategoryIds: doc.categoryIds ?? [],
    autoCategoryIds: doc.autoCategoryIds ?? [],
  };
}

function scopedQuery(categoryId: string): Query {
  if (categoryId === ALL_MEDIA) return assets();
  if (categoryId === UNCATEGORIZED_MEDIA) return assets().where("allCategoryIds", "==", []);
  return assets().where("allCategoryIds", "array-contains", categoryId);
}

/** Firestore caps a batch at 500 writes. */
async function commitInChunks<T>(entries: T[], write: (batch: WriteBatch, entry: T) => void): Promise<void> {
  for (let i = 0; i < entries.length; i += BATCH_LIMIT) {
    const batch = adminDb().batch();
    entries.slice(i, i + BATCH_LIMIT).forEach((entry) => write(batch, entry));
    await batch.commit();
  }
}

async function assetDocsForUrls(urls: string[]) {
  const bucket = bucketName();
  const refs = Array.from(
    new Set(urls.map((url) => libraryStoragePath(url, bucket)).filter((p): p is string => !!p))
  ).map((path) => assets().doc(assetDocId(path)));
  if (refs.length === 0) return [];
  return (await adminDb().getAll(...refs)).filter((snap) => snap.exists);
}

/** Categories with live counts (count() aggregations — no image docs are read). Empty country categories are hidden. */
export async function listMediaCategoryDocs(): Promise<MediaCategoryList> {
  const snap = await categoriesCol().get();
  const [counts, totalCount, uncategorizedCount] = await Promise.all([
    Promise.all(snap.docs.map((doc) => scopedQuery(doc.id).count().get())),
    assets().count().get(),
    scopedQuery(UNCATEGORIZED_MEDIA).count().get(),
  ]);

  const categories: MediaCategory[] = snap.docs
    .map((doc, i) => {
      const data = doc.data() as { name: string; kind?: MediaCategoryKind };
      return {
        id: doc.id,
        name: data.name,
        kind: data.kind ?? (isCountryCategoryId(doc.id) ? "country" : "custom"),
        imageCount: counts[i].data().count,
      };
    })
    .filter((c) => c.kind === "custom" || c.imageCount > 0)
    .sort((a, b) =>
      a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "custom" ? -1 : 1
    );

  return {
    categories,
    totalCount: totalCount.data().count,
    uncategorizedCount: uncategorizedCount.data().count,
  };
}

/** One page of a category (or ALL_MEDIA / UNCATEGORIZED_MEDIA), newest first. */
export async function listMediaPageDocs(categoryId: string, cursor?: string | null): Promise<MediaPage> {
  let query = scopedQuery(categoryId).orderBy("uploadedAt", "desc").limit(PAGE_SIZE);
  if (cursor) {
    const after = await assets().doc(cursor).get();
    if (after.exists) query = query.startAfter(after);
  }
  const snap = await query.get();
  return {
    items: snap.docs.map((doc) => toItem(doc.data() as MediaAssetDoc)),
    nextCursor: snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length - 1].id : null,
  };
}

/** Called by uploadImage — every non-private upload lands in the library. */
export async function recordUploadedImage(url: string): Promise<void> {
  const storagePath = libraryStoragePath(url, bucketName());
  if (!storagePath) return;
  await assets()
    .doc(assetDocId(storagePath))
    .set(newAssetDoc(url, storagePath, new Date().toISOString()));
}

/**
 * Re-points one content doc's "used in" entries at the images it uses now:
 * images it no longer uses lose the usage (and, for tours, the automatic
 * country category); new ones gain it. Bucket images missing from the index
 * are added. Call after every save of a ContentCollection doc.
 */
export async function syncContentMedia(collection: ContentCollection, docId: string): Promise<void> {
  const ownerKey = `${collection}/${docId}`;
  const [contentSnap, previousSnap] = await Promise.all([
    adminDb().collection(collection).doc(docId).get(),
    assets().where("usageKeys", "array-contains", ownerKey).get(),
  ]);

  const bucket = bucketName();
  const { images, countries } = contentSnap.exists
    ? contentImages(collection, contentSnap.data())
    : { images: [], countries: [] };

  // storagePath → this doc's current URL + labels for that image.
  const current = new Map<string, { url: string; labels: string[] }>();
  for (const { url, label } of images) {
    const storagePath = libraryStoragePath(url, bucket);
    if (!storagePath) continue;
    const entry = current.get(storagePath) ?? { url, labels: [] };
    if (!entry.labels.includes(label)) entry.labels.push(label);
    current.set(storagePath, entry);
  }

  const docs = new Map<string, MediaAssetDoc>();
  previousSnap.docs.forEach((doc) => docs.set(doc.id, doc.data() as MediaAssetDoc));
  const missingRefs = Array.from(current.keys())
    .map(assetDocId)
    .filter((id) => !docs.has(id))
    .map((id) => assets().doc(id));
  if (missingRefs.length) {
    const fetched = await adminDb().getAll(...missingRefs);
    fetched.forEach((doc) => {
      if (doc.exists) docs.set(doc.id, doc.data() as MediaAssetDoc);
    });
  }

  const now = new Date().toISOString();
  const writes: { ref: DocumentReference; doc: MediaAssetDoc }[] = [];
  for (const [storagePath, { url, labels }] of current) {
    const id = assetDocId(storagePath);
    const doc = docs.get(id) ?? newAssetDoc(url, storagePath, now);
    docs.delete(id);
    writes.push({
      ref: assets().doc(id),
      doc: finalizeAsset({ ...doc, usages: { ...doc.usages, [ownerKey]: { labels, countries } } }),
    });
  }
  // Whatever's left used to be in this doc and isn't any more.
  for (const [id, doc] of docs) {
    const usages = { ...doc.usages };
    delete usages[ownerKey];
    writes.push({ ref: assets().doc(id), doc: finalizeAsset({ ...doc, usages }) });
  }

  await Promise.all([
    commitInChunks(writes, (batch, { ref, doc }) => batch.set(ref, doc)),
    ensureCountryCategories(countries),
  ]);
}

/** syncContentMedia for save actions — a library-index hiccup is logged, never fails the save itself. */
export async function syncContentMediaSafely(collection: ContentCollection, docId: string): Promise<void> {
  try {
    await syncContentMedia(collection, docId);
  } catch (error) {
    console.error(`Failed to sync image library for ${collection}/${docId}`, error);
  }
}

/** Country categories are docs too, so listing categories is one small read. */
export async function ensureCountryCategories(countries: string[]): Promise<void> {
  if (countries.length === 0) return;
  const batch = adminDb().batch();
  for (const country of new Set(countries)) {
    batch.set(
      categoriesCol().doc(countryCategoryId(country)),
      { name: country, kind: "country" },
      { merge: true }
    );
  }
  await batch.commit();
}

/** True when any category (custom or country) already uses this name, case-insensitively. */
export async function mediaCategoryNameTaken(name: string, exceptId?: string): Promise<boolean> {
  const wanted = name.trim().toLowerCase();
  const snap = await categoriesCol().select("name").get();
  return snap.docs.some(
    (doc) =>
      doc.id !== exceptId &&
      String((doc.data() as { name?: string }).name ?? "").toLowerCase() === wanted
  );
}

export async function createMediaCategoryDoc(name: string): Promise<string> {
  const ref = categoriesCol().doc();
  await ref.set({ categoryId: ref.id, name, kind: "custom", createdAt: new Date().toISOString() });
  return ref.id;
}

export async function renameMediaCategoryDoc(categoryId: string, name: string): Promise<void> {
  await categoriesCol().doc(categoryId).update({ name });
}

/** Images are never deleted with a category — they just lose the label (and may become uncategorized). */
export async function deleteMediaCategoryDoc(categoryId: string): Promise<void> {
  const assigned = await assets().where("categoryIds", "array-contains", categoryId).get();
  // Custom ids never appear in autoCategoryIds, so removing from both arrays is exact.
  await commitInChunks(assigned.docs, (batch, doc) =>
    batch.update(doc.ref, {
      categoryIds: FieldValue.arrayRemove(categoryId),
      allCategoryIds: FieldValue.arrayRemove(categoryId),
    })
  );
  // Last, so a partial failure leaves the category visible to retry.
  await categoriesCol().doc(categoryId).delete();
}

export async function mediaCategoryExists(categoryId: string): Promise<boolean> {
  return (await categoriesCol().doc(categoryId).get()).exists;
}

/** Adds/removes one manual category on many images at once (images not in the index are skipped). */
export async function setImagesCategoryDoc(
  urls: string[],
  categoryId: string,
  assigned: boolean
): Promise<void> {
  const writes = (await assetDocsForUrls(urls)).map((snap) => {
    const doc = snap.data() as MediaAssetDoc;
    const categoryIds = assigned
      ? [...doc.categoryIds, categoryId]
      : doc.categoryIds.filter((id) => id !== categoryId);
    return { ref: snap.ref, doc: finalizeAsset({ ...doc, categoryIds }) };
  });
  await commitInChunks(writes, (batch, { ref, doc }) => batch.set(ref, doc));
}

/**
 * Deletes images (Storage file + index doc) — only ones nothing on the site
 * uses; an image in use has to be removed from its tour/post/etc. first.
 * Returns how many were deleted vs. kept because they're in use.
 */
export async function deleteUnusedImageDocs(urls: string[]): Promise<{ deleted: number; inUse: number }> {
  const snaps = await assetDocsForUrls(urls);
  const unused = snaps.filter((snap) => ((snap.data() as MediaAssetDoc).usageKeys ?? []).length === 0);
  const bucket = adminStorage().bucket();

  for (const snap of unused) {
    const { storagePath } = snap.data() as MediaAssetDoc;
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
    await snap.ref.delete();
  }
  return { deleted: unused.length, inUse: snaps.length - unused.length };
}
