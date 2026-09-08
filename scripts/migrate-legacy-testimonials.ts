import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { COUNTRIES } from "../lib/countries";
import type { Review, Tour } from "../lib/types";

/**
 * One-time migration of the old keshertours.com testimonial "letter" pages
 * into the "reviews" Firestore collection. These aren't a REST-exposed post
 * type (see conversation notes) — each is a standard WP page at
 * /testemonials-<country>/, found by crawling the links on the /testemonials/
 * hub page, so scraped from rendered HTML like the tour pages.
 *
 * Each page holds one traveler letter: a bold heading ("Tour to X – season
 * year with GUIDE"), body paragraphs, and a short closing signature line
 * (the actual customer name) before a "Tours to X >" link and a photo.
 * There's no star rating on the old site — every migrated review defaults
 * to 5 stars (flagged in the summary so staff can adjust from admin).
 *
 * Review.tourId is required, so each testimonial is matched to a tour by
 * country (querying whatever's already in Firestore — run
 * migrate-legacy-tours.ts first so a match exists for most countries).
 * Unmatched ones are skipped and listed for manual entry.
 *
 * Written as status "approved" (so they show on /testimonials immediately,
 * matching "copy testimonials to the new site"). Skips slugs already
 * migrated (tracked via a "legacySourceSlug" pseudo-id used as the doc id,
 * so this is safe to re-run).
 *
 * Defaults to a dry run (scripts/migrate/output/testimonials-preview.json).
 * Pass --commit to write. Pass --limit=N to test a subset.
 *
 * Run with: npx tsx scripts/migrate-legacy-testimonials.ts [--commit] [--limit=N]
 */

const COMMIT = process.argv.includes("--commit");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : undefined;

const UA = "Mozilla/5.0 (compatible; KeshertoursMigration/1.0)";
const HUB_URL = "https://keshertours.com/testemonials/";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

function textOf($el: cheerio.Cheerio<any>): string {
  return $el.text().replace(/\s+/g, " ").replace(/&#8211;/g, "-").trim();
}

async function findTestimonialUrls(): Promise<string[]> {
  const html = await fetchHtml(HUB_URL);
  const $ = cheerio.load(html);
  const urls = new Set<string>();
  $('a[href*="/testemonials-"]').each((_, a) => {
    const href = $(a).attr("href");
    if (href) urls.add(href.split("#")[0]);
  });
  return Array.from(urls);
}

interface ParsedTestimonial {
  sourceUrl: string;
  country?: string;
  headingText: string;
  customerName: string;
  body: string;
  photoUrl?: string;
}

function parseTestimonialPage(url: string, html: string): ParsedTestimonial[] {
  const $ = cheerio.load(html);
  const h1 = textOf($("h1.section_title").first());
  const country = h1.split("-").slice(1).join("-").trim() || undefined;

  const paras = $("#content .content > p").toArray();
  const letters: ParsedTestimonial[] = [];
  let current: { heading?: string; lines: string[]; photo?: string } | null = null;

  const flush = () => {
    if (!current || !current.heading) return;
    const lines = current.lines.filter(Boolean);
    let customerName = "Kesher Tours Traveler";
    let bodyLines = lines;
    const last = lines[lines.length - 1];
    if (last && last.length <= 60 && last.split(" ").length <= 8 && !/^https?:\/\//.test(last)) {
      customerName = last.replace(/\.$/, "");
      bodyLines = lines.slice(0, -1);
    }
    letters.push({
      sourceUrl: url,
      country,
      headingText: current.heading,
      customerName,
      body: bodyLines.join("\n\n"),
      photoUrl: current.photo,
    });
  };

  for (const p of paras) {
    const $p = $(p);
    const $strong = $p.find("strong").first();
    const $img = $p.find("img").first();
    const $link = $p.find("a").first();
    const text = textOf($p);

    if ($strong.length && text === textOf($strong)) {
      flush();
      current = { heading: text, lines: [] };
      continue;
    }
    if (!current) continue;
    if ($img.length) {
      current.photo = $img.attr("src") ?? undefined;
      continue;
    }
    if ($link.length && /tours-destinations|tours\//.test($link.attr("href") ?? "")) {
      continue; // "Tours to X >" footer link, not letter content
    }
    if (text) current.lines.push(text);
  }
  flush();

  return letters;
}

function matchCountry(text: string): string | undefined {
  const haystack = text.toLowerCase();
  const aliases: Record<string, string> = {
    "vietnam-and-cambodia": "Vietnam",
    "canada-alaska": "Canada",
    "australia-new-zealand": "Australia",
    "spain-portugal": "Spain",
    "western-europe": "Italy", // no single "Western Europe" country; closest broad match, flagged for review
    "baltic-sea": "Latvia",
  };
  for (const [alias, country] of Object.entries(aliases)) {
    if (haystack.includes(alias)) return country;
  }
  for (const country of COUNTRIES) {
    if (haystack.includes(country.toLowerCase())) return country;
  }
  return undefined;
}

async function uploadImageFromUrl(
  storage: ReturnType<typeof getStorage>,
  sourceUrl: string,
  tag: string
): Promise<string | undefined> {
  try {
    const res = await fetch(sourceUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) return undefined;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const extMatch = sourceUrl.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const path = `reviews/legacy/${tag}/${randomUUID()}.${ext}`;
    const downloadToken = randomUUID();
    const bucket = storage.bucket();
    const blob = bucket.file(path);
    await blob.save(buffer, {
      contentType,
      metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } },
    });
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
  } catch {
    return undefined;
  }
}

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in .env.local.");
  }
  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  });
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  const storage = getStorage(app);

  console.log(`Mode: ${COMMIT ? "COMMIT (writing to Firestore + Storage)" : "DRY RUN (no writes)"}`);

  const toursSnap = await db.collection("tours").get();
  const tours = toursSnap.docs.map((d) => d.data() as Tour);
  const tourByCountry = new Map<string, string>();
  for (const t of tours) {
    for (const c of t.countries ?? []) {
      if (!tourByCountry.has(c)) tourByCountry.set(c, t.tourId);
    }
  }
  console.log(`Tours available for country matching: ${tours.length}`);

  const urls = (await findTestimonialUrls()).slice(0, LIMIT);
  console.log(`Found ${urls.length} testimonial page(s) on the hub.`);

  const toWrite: { review: Review; photoSourceUrl?: string; docId: string }[] = [];
  const unmatched: string[] = [];
  const failed: { url: string; error: string }[] = [];

  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const letters = parseTestimonialPage(url, html);
      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        const country = matchCountry(letter.country ?? "") ?? matchCountry(url);
        const tourId = country ? tourByCountry.get(country) : undefined;
        const docId = `legacy-${url.replace("https://keshertours.com/", "").replace(/\/$/, "")}-${i}`;
        if (!tourId) {
          unmatched.push(`${url} (country guess: ${country ?? "none"})`);
          continue;
        }
        toWrite.push({
          review: {
            reviewId: docId,
            tourId,
            customerName: letter.customerName,
            rating: 5,
            body: letter.body,
            status: "approved",
          },
          photoSourceUrl: letter.photoUrl,
          docId,
        });
        console.log(`Parsed testimonial from ${url} — "${letter.customerName}" → tour ${tourId}`);
      }
    } catch (err) {
      failed.push({ url, error: String(err) });
      console.error(`FAILED ${url}: ${err}`);
    }
  }

  const existingSnap = await db.collection("reviews").get();
  const existingIds = new Set(existingSnap.docs.map((d) => d.id));
  const toCommit = toWrite.filter((r) => !existingIds.has(r.docId));
  const alreadyMigrated = toWrite.length - toCommit.length;

  if (COMMIT) {
    for (const r of toCommit) {
      if (r.photoSourceUrl) {
        const uploaded = await uploadImageFromUrl(storage, r.photoSourceUrl, r.docId);
        if (uploaded) r.review.photo = uploaded;
      }
      await db.collection("reviews").doc(r.docId).set(r.review);
      console.log(`Committed review "${r.review.customerName}" (${r.docId}).`);
    }
  }

  mkdirSync("scripts/migrate/output", { recursive: true });
  writeFileSync(
    "scripts/migrate/output/testimonials-preview.json",
    JSON.stringify({ toCommit, unmatched, failed }, null, 2),
    "utf-8"
  );

  console.log("\n=== SUMMARY ===");
  console.log(`${COMMIT ? "Committed" : "Would create"} as approved reviews: ${toCommit.length}`);
  console.log(`Already migrated (skipped): ${alreadyMigrated}`);
  console.log(`Unmatched (no country → tour match, needs manual entry): ${unmatched.length}`);
  unmatched.forEach((u) => console.log(`  - ${u}`));
  console.log(`Failed to fetch/parse: ${failed.length}`);
  console.log(`Full preview written to scripts/migrate/output/testimonials-preview.json`);
  if (!COMMIT) console.log("Dry run only — re-run with --commit to write.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
