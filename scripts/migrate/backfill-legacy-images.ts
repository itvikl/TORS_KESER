import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";
import * as cheerio from "cheerio";
import type { Tour, BlogPost, Review } from "../../lib/types";

/**
 * One-off repair: migrate-legacy-{tours,blog,testimonials}.ts all failed to
 * upload any image, silently, because .env.local's
 * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is empty (fixed in those scripts now,
 * but they skip docs that already exist, so the 53 tours / 58 posts / 9
 * reviews already committed need a separate backfill pass instead of a
 * re-run). This re-derives each doc's old-site source URL from its doc id
 * (tours/blog: doc id IS the slug; reviews: id is `legacy-<path>-<index>`)
 * and re-scrapes just the image(s), so no other field is touched.
 *
 * Run with: npx tsx scripts/migrate/backfill-legacy-images.ts [--commit]
 */

const COMMIT = process.argv.includes("--commit");
const UA = "Mozilla/5.0 (compatible; KeshertoursMigration/1.0)";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

async function uploadImageFromUrl(
  storage: ReturnType<typeof getStorage>,
  sourceUrl: string,
  path: string
): Promise<string | undefined> {
  const res = await fetch(sourceUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    console.log(`    fetch failed (${res.status}): ${sourceUrl}`);
    return undefined;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const downloadToken = randomUUID();
  const bucket = storage.bucket();
  const blob = bucket.file(path);
  await blob.save(buffer, {
    contentType,
    metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
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
  const storage = getStorage(app);
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"} | bucket: ${storage.bucket().name}`);

  // ---------- TOURS ----------
  const toursSnap = await db.collection("tours").get();
  const toursNeedingImages = toursSnap.docs.filter((d) => {
    const t = d.data() as Tour;
    return t.status === "archived" && !t.heroImage;
  });
  console.log(`\nTours needing images: ${toursNeedingImages.length}`);
  let toursFixed = 0;
  for (const doc of toursNeedingImages) {
    const slug = doc.id;
    const url = `https://keshertours.com/tours/${slug}/`;
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const galleryUrls = new Set<string>();
      $("#sidebar_gallery .gallery a[href]").each((_, a) => {
        const href = $(a).attr("href");
        if (href && /wp-content\/uploads\//.test(href)) galleryUrls.add(href);
      });
      const sources = Array.from(galleryUrls);
      if (sources.length === 0) {
        console.log(`  ${slug}: no gallery images on page, skipping`);
        continue;
      }
      if (!COMMIT) {
        console.log(`  ${slug}: would upload ${sources.length} image(s)`);
        continue;
      }
      const uploaded: string[] = [];
      for (let i = 0; i < sources.length; i++) {
        const extMatch = sources[i].match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
        const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
        const path = `tours/legacy/${slug}/${i}-${randomUUID()}.${ext}`;
        const url2 = await uploadImageFromUrl(storage, sources[i], path);
        if (url2) uploaded.push(url2);
      }
      if (uploaded.length > 0) {
        await doc.ref.update({ heroImage: uploaded[0], gallery: uploaded });
        toursFixed++;
        console.log(`  ${slug}: uploaded ${uploaded.length} image(s)`);
      }
    } catch (err) {
      console.log(`  ${slug}: FAILED — ${err}`);
    }
  }

  // ---------- BLOG ----------
  const blogSnap = await db.collection("blogPosts").get();
  const blogNeedingImages = blogSnap.docs.filter((d) => !(d.data() as BlogPost).heroImage);
  console.log(`\nBlog posts needing images: ${blogNeedingImages.length}`);
  let blogFixed = 0;
  for (const doc of blogNeedingImages) {
    const slug = doc.id;
    try {
      const res = await fetch(`https://keshertours.com/wp-json/wp/v2/posts?slug=${slug}&_embed=1`, {
        headers: { "User-Agent": UA },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const posts = (await res.json()) as any[];
      const sourceUrl: string | undefined = posts[0]?._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
      if (!sourceUrl) {
        console.log(`  ${slug}: no featured image on old site, skipping`);
        continue;
      }
      if (!COMMIT) {
        console.log(`  ${slug}: would upload hero image`);
        continue;
      }
      const extMatch = sourceUrl.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
      const path = `blog/legacy/${slug}/${randomUUID()}.${ext}`;
      const uploadedUrl = await uploadImageFromUrl(storage, sourceUrl, path);
      if (uploadedUrl) {
        await doc.ref.update({ heroImage: uploadedUrl });
        blogFixed++;
        console.log(`  ${slug}: uploaded hero image`);
      }
    } catch (err) {
      console.log(`  ${slug}: FAILED — ${err}`);
    }
  }

  // ---------- REVIEWS (testimonials) ----------
  const reviewsSnap = await db.collection("reviews").get();
  const reviewsNeedingImages = reviewsSnap.docs.filter(
    (d) => d.id.startsWith("legacy-") && !(d.data() as Review).photo
  );
  console.log(`\nReviews needing images: ${reviewsNeedingImages.length}`);
  let reviewsFixed = 0;
  for (const doc of reviewsNeedingImages) {
    // id shape: legacy-<url-path-with-dashes>-<letterIndex>
    const withoutPrefix = doc.id.replace(/^legacy-/, "");
    const lastDash = withoutPrefix.lastIndexOf("-");
    const pathSegment = withoutPrefix.slice(0, lastDash);
    const letterIndex = parseInt(withoutPrefix.slice(lastDash + 1), 10);
    const url = `https://keshertours.com/${pathSegment}/`;
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const paras = $("#content .content > p").toArray();
      let letterCount = -1;
      let photoUrl: string | undefined;
      for (const p of paras) {
        const $p = $(p);
        const $strong = $p.find("strong").first();
        const text = $p.text().replace(/\s+/g, " ").trim();
        if ($strong.length && text === $strong.text().replace(/\s+/g, " ").trim()) {
          letterCount++;
          continue;
        }
        const $img = $p.find("img").first();
        if ($img.length && letterCount === letterIndex) {
          photoUrl = $img.attr("src") ?? undefined;
        }
      }
      if (!photoUrl) {
        console.log(`  ${doc.id}: no photo found on page, skipping`);
        continue;
      }
      if (!COMMIT) {
        console.log(`  ${doc.id}: would upload photo`);
        continue;
      }
      const extMatch = photoUrl.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
      const path = `reviews/legacy/${doc.id}/${randomUUID()}.${ext}`;
      const uploadedUrl = await uploadImageFromUrl(storage, photoUrl, path);
      if (uploadedUrl) {
        await doc.ref.update({ photo: uploadedUrl });
        reviewsFixed++;
        console.log(`  ${doc.id}: uploaded photo`);
      }
    } catch (err) {
      console.log(`  ${doc.id}: FAILED — ${err}`);
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Tours fixed: ${toursFixed}/${toursNeedingImages.length}`);
  console.log(`Blog posts fixed: ${blogFixed}/${blogNeedingImages.length}`);
  console.log(`Reviews fixed: ${reviewsFixed}/${reviewsNeedingImages.length}`);
  if (!COMMIT) console.log("Dry run only — re-run with --commit to write.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
