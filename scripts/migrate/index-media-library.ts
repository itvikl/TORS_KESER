import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";
import {
  ASSETS_COLLECTION,
  CATEGORIES_COLLECTION,
  CONTENT_COLLECTIONS,
  PRIVATE_STORAGE_PREFIXES,
  assetDocId,
  contentImages,
  countryCategoryId,
  finalizeAsset,
  libraryStoragePath,
  newAssetDoc,
  replaceContentImages,
  storageDownloadUrl,
  type MediaAssetDoc,
} from "../../lib/media/assets";

/**
 * One-off: builds the image library index (`mediaAssets`, see
 * lib/media/assets.ts) from what already exists, so the library never has
 * to list the bucket or scan site content again.
 *
 *  1. Every image in the Storage bucket (minus passport scans) gets an index
 *     doc. Files without a download token get one.
 *  2. Image fields in tours / blog posts / offers / reviews / staff that
 *     point outside the bucket are copied into it (library/migrated/…) and
 *     the content field is rewritten to the bucket URL. Site-relative paths
 *     ("/images/…" from public/) are reported and left alone.
 *  3. "Used in" and tour countries are saved on each index doc; a country
 *     category doc is created per tour country.
 *  4. Manual category assignments from the earlier (url-keyed) index are
 *     carried over, and those old docs removed.
 *
 * Safe to re-run: it rebuilds every index doc from the bucket + content,
 * keeping manual categories.
 *
 * Run with: npx tsx scripts/migrate/index-media-library.ts [--commit]
 */

const COMMIT = process.argv.includes("--commit");
const UA = "Mozilla/5.0 (compatible; KeshertoursMigration/1.0)";
const BATCH_LIMIT = 450;

async function commitInChunks<T>(
  db: Firestore,
  entries: T[],
  write: (batch: FirebaseFirestore.WriteBatch, entry: T) => void
) {
  for (let i = 0; i < entries.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    entries.slice(i, i + BATCH_LIMIT).forEach((entry) => write(batch, entry));
    await batch.commit();
  }
}

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID!;
  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  });
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  const bucket = getStorage(app).bucket();
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"} | bucket: ${bucket.name}\n`);

  // ---------- 1. Bucket images ----------
  const docs = new Map<string, MediaAssetDoc>(); // asset doc id → doc
  const [files] = await bucket.getFiles();
  let tokensAdded = 0;
  for (const file of files) {
    if (PRIVATE_STORAGE_PREFIXES.some((prefix) => file.name.startsWith(prefix))) continue;
    if (!String(file.metadata.contentType ?? "").startsWith("image/")) continue;

    const tokens = file.metadata.metadata?.firebaseStorageDownloadTokens;
    let token = typeof tokens === "string" ? tokens.split(",")[0] : undefined;
    if (!token) {
      token = randomUUID();
      tokensAdded++;
      if (COMMIT) await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
    }
    const url = storageDownloadUrl(bucket.name, file.name, token);
    docs.set(
      assetDocId(file.name),
      newAssetDoc(url, file.name, file.metadata.timeCreated ?? new Date().toISOString())
    );
  }
  console.log(`Bucket images: ${docs.size} (download tokens ${COMMIT ? "added" : "to add"}: ${tokensAdded})`);

  // ---------- 2. Copy external content images into the bucket ----------
  const copied = new Map<string, string | null>(); // source URL → bucket URL (null = failed)
  const relativeKept = new Set<string>();
  let docsRewritten = 0;

  async function copyIntoBucket(sourceUrl: string): Promise<string | null> {
    if (copied.has(sourceUrl)) return copied.get(sourceUrl)!;
    let result: string | null = null;
    try {
      const res = await fetch(sourceUrl, { headers: { "User-Agent": UA } });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.startsWith("image/")) {
        console.log(`    can't copy (${res.status} ${contentType || "no type"}): ${sourceUrl}`);
      } else {
        const ext = contentType.split("/")[1]?.replace("jpeg", "jpg").split(";")[0] || "jpg";
        const path = `library/migrated/${randomUUID()}.${ext}`;
        const token = randomUUID();
        await bucket.file(path).save(Buffer.from(await res.arrayBuffer()), {
          contentType,
          metadata: { metadata: { firebaseStorageDownloadTokens: token } },
        });
        result = storageDownloadUrl(bucket.name, path, token);
        docs.set(assetDocId(path), newAssetDoc(result, path, new Date().toISOString()));
      }
    } catch (err) {
      console.log(`    can't copy (${err}): ${sourceUrl}`);
    }
    copied.set(sourceUrl, result);
    return result;
  }

  const content: { collection: (typeof CONTENT_COLLECTIONS)[number]; id: string; data: unknown }[] = [];
  for (const collection of CONTENT_COLLECTIONS) {
    const snap = await db.collection(collection).get();
    for (const doc of snap.docs) {
      let data: Record<string, unknown> = doc.data();
      const external = contentImages(collection, data)
        .images.map((i) => i.url)
        .filter((url) => !libraryStoragePath(url, bucket.name));

      const toCopy = external.filter((url) => /^https?:\/\//.test(url));
      external.filter((url) => !/^https?:\/\//.test(url)).forEach((url) => relativeKept.add(url));

      if (toCopy.length) {
        console.log(`  ${collection}/${doc.id}: ${toCopy.length} external image(s)`);
        if (COMMIT) {
          const map = new Map<string, string>();
          for (const url of new Set(toCopy)) {
            const newUrl = await copyIntoBucket(url);
            if (newUrl) map.set(url, newUrl);
          }
          const patch = replaceContentImages(collection, data, (url) => map.get(url) ?? url);
          if (patch) {
            await doc.ref.update(patch);
            data = { ...data, ...patch };
            docsRewritten++;
          }
        }
      }
      content.push({ collection, id: doc.id, data });
    }
  }
  const externalCount = new Set(
    content.flatMap(({ collection, data }) =>
      contentImages(collection, data)
        .images.map((i) => i.url)
        .filter((url) => /^https?:\/\//.test(url) && !libraryStoragePath(url, bucket.name))
    )
  ).size;
  console.log(
    COMMIT
      ? `External images copied: ${[...copied.values()].filter(Boolean).length}, failed: ${[...copied.values()].filter((v) => !v).length}, docs rewritten: ${docsRewritten}`
      : `External images to copy: ${externalCount}`
  );
  if (relativeKept.size) {
    console.log(`Site-relative paths left as-is (not in the library): ${[...relativeKept].join(", ")}`);
  }

  // ---------- 3. Usages + countries ----------
  const countries = new Set<string>();
  const missingFiles = new Set<string>();
  for (const { collection, id, data } of content) {
    const { images, countries: docCountries } = contentImages(collection, data);
    docCountries.forEach((c) => countries.add(c));
    const ownerKey = `${collection}/${id}`;
    for (const { url, label } of images) {
      const storagePath = libraryStoragePath(url, bucket.name);
      if (!storagePath) continue;
      const doc = docs.get(assetDocId(storagePath));
      if (!doc) {
        missingFiles.add(url);
        continue;
      }
      // Keep the URL the site actually uses (its token may differ from the listing's first one).
      if (!Object.keys(doc.usages).length) doc.url = url;
      const usage = doc.usages[ownerKey] ?? { labels: [], countries: docCountries };
      if (!usage.labels.includes(label)) usage.labels.push(label);
      doc.usages[ownerKey] = usage;
    }
  }
  if (missingFiles.size) {
    console.log(`Content points at ${missingFiles.size} bucket file(s) that no longer exist — not indexed.`);
  }

  // ---------- 4. Carry over manual categories from the previous index ----------
  const [oldAssetsSnap, categoriesSnap] = await Promise.all([
    db.collection(ASSETS_COLLECTION).get(),
    db.collection(CATEGORIES_COLLECTION).get(),
  ]);
  const staleIds: string[] = [];
  for (const old of oldAssetsSnap.docs) {
    const { url, storagePath, categoryIds } = old.data() as {
      url?: string;
      storagePath?: string;
      categoryIds?: string[];
    };
    const path = storagePath ?? libraryStoragePath(url, bucket.name);
    const target = path ? docs.get(assetDocId(path)) : undefined;
    if (target) target.categoryIds.push(...(categoryIds ?? []));
    if (!target || old.id !== assetDocId(path!)) staleIds.push(old.id);
  }

  const finalDocs = Array.from(docs, ([id, doc]) => ({ id, doc: finalizeAsset(doc) }));
  const used = finalDocs.filter(({ doc }) => doc.usageKeys.length > 0).length;
  console.log(
    `\nIndex: ${finalDocs.length} images (${used} used on the site, ${finalDocs.length - used} unused), ` +
      `${countries.size} country categories, ${staleIds.length} old index docs to remove`
  );

  if (!COMMIT) {
    console.log("\nDry run — nothing written. Re-run with --commit.");
    return;
  }

  await commitInChunks(db, finalDocs, (batch, { id, doc }) =>
    batch.set(db.collection(ASSETS_COLLECTION).doc(id), doc)
  );
  await commitInChunks(db, staleIds, (batch, id) =>
    batch.delete(db.collection(ASSETS_COLLECTION).doc(id))
  );
  await commitInChunks(db, [...countries], (batch, country) =>
    batch.set(
      db.collection(CATEGORIES_COLLECTION).doc(countryCategoryId(country)),
      { name: country, kind: "country" },
      { merge: true }
    )
  );
  // Categories from the earlier version had no kind.
  await commitInChunks(
    db,
    categoriesSnap.docs.filter((doc) => !doc.data().kind),
    (batch, doc) => batch.update(doc.ref, { kind: "custom" })
  );
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
