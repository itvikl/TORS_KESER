import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { COUNTRIES } from "../../lib/countries";
import type { Review, Tour } from "../../lib/types";
import {
  ASSETS_COLLECTION,
  CATEGORIES_COLLECTION,
  assetDocId,
  finalizeAsset,
  newAssetDoc,
  storageDownloadUrl,
  type MediaAssetDoc,
} from "../../lib/media/assets";

/**
 * Second pass over the old keshertours.com testimonial pages
 * (/testemonials-<country>/, linked from /testemonials/).
 * migrate-legacy-testimonials.ts only understood letters that start with a
 * bold heading, so most letters — and their photos — were never imported.
 *
 * The pages mix two layouts:
 *   a) text…, signature, "Tours to X >" link, [photo]   (photo follows its letter)
 *   b) <strong>heading</strong>, text…, [photo]         (no link; photo ends it)
 * Both are handled. Letters already in Firestore (matched by body text) are
 * skipped, but get the photo if they're missing one. Photos are copied into
 * Storage (reviews/legacy/…) and indexed in the image library under a
 * "Testimonials" category. New reviews are written as approved, 5 stars.
 *
 * Dry run by default (writes scripts/migrate/output/testimonials-import-preview.json).
 * Run with: npx tsx scripts/migrate/import-legacy-testimonials.ts [--commit]
 */

const COMMIT = process.argv.includes("--commit");
const UA = "Mozilla/5.0 (compatible; KeshertoursMigration/1.0)";
const HUB_URL = "https://keshertours.com/testemonials/";
const TESTIMONIALS_CATEGORY = "Testimonials";

interface Letter {
  sourceUrl: string;
  countryHint: string;
  heading?: string;
  lines: string[];
  photoUrl?: string;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

function clean(text: string): string {
  return text.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

function normalizeBody(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);
}

function parsePage(url: string, html: string): Letter[] {
  const $ = cheerio.load(html);
  const countryHint = clean($("h1.section_title").first().text());
  const letters: Letter[] = [];
  let current: Letter | null = null;

  const close = () => {
    if (current && current.lines.length) letters.push(current);
    current = null;
  };
  const open = (): Letter => (current ??= { sourceUrl: url, countryHint, lines: [] });

  for (const p of $("#content .content > p").toArray()) {
    const $p = $(p);
    const text = clean($p.text());
    const $img = $p.find("img").first();
    const href = $p.find("a").first().attr("href") ?? "";
    const $strong = $p.find("strong").first();

    if ($img.length) {
      const src = $img.attr("src");
      if (!src) continue;
      if (current && current.lines.length && !current.photoUrl) {
        // Layout b: the photo ends the letter.
        current.photoUrl = src;
        close();
      } else {
        // Layout a: the photo belongs to the letter just closed by its link.
        const last = letters[letters.length - 1];
        if (last && !last.photoUrl) last.photoUrl = src;
      }
      continue;
    }
    if (/keshertours\.com\/tours/.test(href)) {
      close(); // "Tours to X >" ends a letter
      continue;
    }
    if (!text) continue;
    if ($strong.length && clean($strong.text()) === text) {
      close();
      open().heading = text;
      continue;
    }
    open().lines.push(text);
  }
  close();
  return letters;
}

const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";
/** Signatures sometimes end with the holiday they were written on ("…, Harley P. Abrams Passover"). */
const HOLIDAYS = "Passover|Pesach|Purim|Sukkot|Succot|Chanukah|Hanukkah|Shavuot|Rosh Hashana";

/** Last line is the signature when it's short; the name is what's after the last comma, minus a trailing date. */
function splitSignature(lines: string[]): { customerName: string; body: string } {
  const last = lines[lines.length - 1];
  if (lines.length > 1 && last.length <= 80 && last.split(" ").length <= 12) {
    const withoutDate = last
      .replace(new RegExp(`,?\\s*(?:(?:${MONTHS})\\s+)?(?:19|20)\\d{2}\\.?$`), "")
      .trim()
      .replace(new RegExp(`\\s+(?:${HOLIDAYS})$`, "i"), "")
      .trim();
    const name = withoutDate.split(",").pop()!.trim().replace(/\.$/, "");
    return {
      customerName: name || "Kesher Tours Traveler",
      body: lines.slice(0, -1).join("\n\n"),
    };
  }
  return { customerName: "Kesher Tours Traveler", body: lines.join("\n\n") };
}

function matchCountry(text: string): string | undefined {
  const haystack = text.toLowerCase();
  const aliases: Record<string, string> = {
    "vietnam-and-cambodia": "Vietnam",
    "canada-alaska": "Canada",
    "canada & alaska": "Canada",
    "australia-new-zealand": "Australia",
    "australia & new zealand": "Australia",
    "spain-portugal": "Spain",
    "spain & portugal": "Spain",
    "western-europe": "Italy",
    "western europe": "Italy",
    "baltic-sea": "Latvia",
    "baltic sea": "Latvia",
    "carpathian": "Ukraine",
    "moscow": "Russia",
  };
  for (const [alias, country] of Object.entries(aliases)) {
    if (haystack.includes(alias)) return country;
  }
  for (const country of COUNTRIES) {
    if (haystack.includes(country.toLowerCase())) return country;
  }
  return undefined;
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

  // Tour per country, same rule as the first migration (first tour listing it).
  const tourByCountry = new Map<string, Tour>();
  for (const doc of (await db.collection("tours").get()).docs) {
    const tour = doc.data() as Tour;
    for (const c of tour.countries ?? []) if (!tourByCountry.has(c)) tourByCountry.set(c, tour);
  }

  const existing = (await db.collection("reviews").get()).docs.map((d) => d.data() as Review);
  const existingByBody = new Map(existing.map((r) => [normalizeBody(r.body), r]));

  const hub = cheerio.load(await fetchHtml(HUB_URL));
  const pageUrls = new Set<string>();
  hub('a[href*="/testemonials-"]').each((_, a) => {
    const href = hub(a).attr("href");
    if (href) pageUrls.add(href.split("#")[0]);
  });

  const toCreate: { review: Review; photoUrl?: string }[] = [];
  const photoForExisting: { review: Review; photoUrl: string }[] = [];
  const unmatched: string[] = [];
  let alreadyThere = 0;

  for (const url of pageUrls) {
    const slug = url.replace("https://keshertours.com/", "").replace(/\/$/, "");
    let letters: Letter[];
    try {
      letters = parsePage(url, await fetchHtml(url));
    } catch (err) {
      console.log(`${slug}: FAILED to fetch (${err}) — skipped`);
      continue;
    }
    console.log(`${slug}: ${letters.length} letter(s), ${letters.filter((l) => l.photoUrl).length} photo(s)`);

    for (const letter of letters) {
      const { customerName, body } = splitSignature(letter.lines);
      const match = existingByBody.get(normalizeBody(body));
      if (match) {
        alreadyThere++;
        if (!match.photo && letter.photoUrl) photoForExisting.push({ review: match, photoUrl: letter.photoUrl });
        continue;
      }
      const country =
        matchCountry(letter.heading ?? "") ?? matchCountry(letter.countryHint) ?? matchCountry(slug);
      const tour = country ? tourByCountry.get(country) : undefined;
      if (!tour) {
        unmatched.push(`${slug} — "${customerName}" (country guess: ${country ?? "none"})`);
        continue;
      }
      // The same letter can sit on two country pages — import it once.
      existingByBody.set(normalizeBody(body), { body } as Review);
      const reviewId = `legacy-${slug}-${createHash("sha1").update(body).digest("hex").slice(0, 8)}`;
      toCreate.push({
        review: { reviewId, tourId: tour.tourId, customerName, rating: 5, body, status: "approved" },
        photoUrl: letter.photoUrl,
      });
    }
  }

  const newPhotos = toCreate.filter((r) => r.photoUrl).length + photoForExisting.length;
  console.log(
    `\nNew testimonials: ${toCreate.length} (${toCreate.filter((r) => r.photoUrl).length} with photo)` +
      `\nAlready imported: ${alreadyThere} (${photoForExisting.length} get their missing photo)` +
      `\nPhotos to copy into Storage: ${newPhotos}` +
      `\nUnmatched to a tour (skipped): ${unmatched.length}`
  );
  unmatched.forEach((u) => console.log(`  - ${u}`));
  const garbled = toCreate.filter((r) => r.review.body.includes("�")).length;
  if (garbled) console.log(`Note: ${garbled} letter(s) contain "�" characters broken on the old site itself — fix in admin.`);

  mkdirSync("scripts/migrate/output", { recursive: true });
  writeFileSync(
    "scripts/migrate/output/testimonials-import-preview.json",
    JSON.stringify({ toCreate, photoForExisting, unmatched }, null, 2),
    "utf-8"
  );
  console.log("Preview: scripts/migrate/output/testimonials-import-preview.json");

  if (!COMMIT) {
    console.log("\nDry run — nothing written. Re-run with --commit.");
    return;
  }

  // "Testimonials" library category (reused if it already exists).
  const categories = await db.collection(CATEGORIES_COLLECTION).get();
  let categoryId = categories.docs.find(
    (d) => String(d.data().name).toLowerCase() === TESTIMONIALS_CATEGORY.toLowerCase()
  )?.id;
  if (!categoryId) {
    const ref = db.collection(CATEGORIES_COLLECTION).doc();
    await ref.set({ categoryId: ref.id, name: TESTIMONIALS_CATEGORY, kind: "custom", createdAt: new Date().toISOString() });
    categoryId = ref.id;
  }

  async function copyPhoto(sourceUrl: string, reviewId: string, label: string): Promise<string | undefined> {
    const res = await fetch(sourceUrl, { headers: { "User-Agent": UA } });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.startsWith("image/")) {
      console.log(`  photo failed (${res.status}): ${sourceUrl}`);
      return undefined;
    }
    const ext = sourceUrl.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i)?.[1].toLowerCase() ?? "jpg";
    const path = `reviews/legacy/${reviewId}/${randomUUID()}.${ext}`;
    const token = randomUUID();
    await bucket.file(path).save(Buffer.from(await res.arrayBuffer()), {
      contentType,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    const url = storageDownloadUrl(bucket.name, path, token);
    const asset: MediaAssetDoc = newAssetDoc(url, path, new Date().toISOString());
    asset.categoryIds = [categoryId!];
    asset.usages = { [`reviews/${reviewId}`]: { labels: [label], countries: [] } };
    await db.collection(ASSETS_COLLECTION).doc(assetDocId(path)).set(finalizeAsset(asset));
    return url;
  }

  for (const { review, photoUrl } of toCreate) {
    if (photoUrl) review.photo = await copyPhoto(photoUrl, review.reviewId, `Review: ${review.customerName}`);
    await db.collection("reviews").doc(review.reviewId).set(review);
    console.log(`  created ${review.reviewId} — ${review.customerName}`);
  }
  for (const { review, photoUrl } of photoForExisting) {
    const photo = await copyPhoto(photoUrl, review.reviewId, `Review: ${review.customerName}`);
    if (photo) await db.collection("reviews").doc(review.reviewId).update({ photo });
    console.log(`  photo added to ${review.reviewId}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
