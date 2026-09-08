import { config } from "dotenv";
config({ path: ".env.local" });
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";
import * as cheerio from "cheerio";
import type { Tour } from "../../lib/types";

/**
 * Targeted fix for the 7 originally-curated PUBLISHED tours whose
 * heroImage/gallery are empty (scripts/clear-broken-seed-images.ts
 * blanked out broken local placeholder paths, and no one has uploaded
 * real photos since — this is the "trip photos" blocker in the
 * readiness plan). Pulls real photography from the old site's matching
 * page, same extraction as the legacy migration, but only touches
 * heroImage/gallery — nothing else on these already-curated docs.
 *
 * Run with: npx tsx scripts/migrate/backfill-published-images.ts [--commit]
 */

const COMMIT = process.argv.includes("--commit");
const UA = "Mozilla/5.0 (compatible; KeshertoursMigration/1.0)";

// slug (Firestore) -> old-site URL to pull the gallery from.
const SOURCES: Record<string, string> = {
  "costa-rica": "https://keshertours.com/tours/costa-rica/",
  italy: "https://keshertours.com/tours/italy/",
  japan: "https://keshertours.com/tours/japan/",
  morocco: "https://keshertours.com/tours/morocco/",
  portugal: "https://keshertours.com/tours/portugal/",
  "kosher-safari-tanzania": "https://keshertours.com/kosher-safari-tanzania/",
  "vietnam-cambodia": "https://keshertours.com/tours/vietnam-cambodia/",
};

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
  const storage = getStorage(app);
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"}`);

  const toursSnap = await db.collection("tours").where("status", "==", "published").get();

  for (const doc of toursSnap.docs) {
    const t = doc.data() as Tour;
    if (t.heroImage) continue; // already has a real image, don't touch
    const sourceUrl = SOURCES[t.slug];
    if (!sourceUrl) {
      console.log(`${t.slug}: no known old-site source, skipping (needs manual upload)`);
      continue;
    }
    try {
      const res = await fetch(sourceUrl, { headers: { "User-Agent": UA } });
      if (!res.ok) {
        console.log(`${t.slug}: source page ${res.status}, skipping`);
        continue;
      }
      const html = await res.text();
      const $ = cheerio.load(html);
      const galleryUrls = new Set<string>();
      $("#sidebar_gallery .gallery a[href]").each((_, a) => {
        const href = $(a).attr("href");
        if (href && /wp-content\/uploads\//.test(href)) galleryUrls.add(href);
      });
      const sources = Array.from(galleryUrls);
      if (sources.length === 0) {
        console.log(`${t.slug}: no gallery images found at ${sourceUrl}, skipping`);
        continue;
      }
      if (!COMMIT) {
        console.log(`${t.slug}: would upload ${sources.length} image(s) from ${sourceUrl}`);
        continue;
      }
      const uploaded: string[] = [];
      for (let i = 0; i < sources.length; i++) {
        const imgRes = await fetch(sources[i], { headers: { "User-Agent": UA } });
        if (!imgRes.ok) continue;
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const extMatch = sources[i].match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
        const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
        const path = `tours/${t.tourId}/${i}-${randomUUID()}.${ext}`;
        const downloadToken = randomUUID();
        const bucket = storage.bucket();
        const blob = bucket.file(path);
        await blob.save(buffer, {
          contentType,
          metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } },
        });
        uploaded.push(
          `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`
        );
      }
      if (uploaded.length > 0) {
        await doc.ref.update({ heroImage: uploaded[0], gallery: uploaded });
        console.log(`${t.slug}: uploaded ${uploaded.length} image(s)`);
      }
    } catch (err) {
      console.log(`${t.slug}: FAILED — ${err}`);
    }
  }
  if (!COMMIT) console.log("Dry run only — re-run with --commit to write.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
