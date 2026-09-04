import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { COUNTRIES } from "../lib/countries";
import type { Tour, ItineraryDay } from "../lib/types";
import legacyTours from "./migrate/legacy-tours-source.json";

/**
 * One-time migration of the ~60 old keshertours.com WordPress tour pages
 * into Firestore, per Eran's direction (2026-09): keep every old tour
 * archived for reference, only the ones already published (or explicitly
 * promoted later) show on the live site.
 *
 * - Skips any slug that already exists in the "tours" collection (the 9
 *   tours already seeded/curated by hand keep their existing content).
 * - Everything newly created is written with status "archived" — never
 *   "published" — even the ones that still show real dates on the old
 *   site. Those are just flagged in the summary for a human decision,
 *   since publishing is a pricing/content call, not a scraping one.
 * - Old-site departure dates are not written as live Departure docs (most
 *   are years stale); the raw price/date snippet is preserved as a note
 *   in the description instead so nothing is lost.
 * - Images are downloaded from the old site and re-uploaded to this
 *   project's Firebase Storage — next.config.ts only allow-lists
 *   firebasestorage.googleapis.com, so hot-linking the old domain won't
 *   render, and it disappears entirely once the old site comes down.
 *
 * Defaults to a dry run: fetches + parses everything and writes a JSON
 * preview to scripts/migrate/output/tours-preview.json, but touches
 * neither Firestore nor Storage. Pass --commit to actually write.
 * Pass --limit=N to only process the first N (by click volume) — useful
 * for spot-checking parse quality before running the full batch.
 *
 * Run with: npx tsx scripts/migrate-legacy-tours.ts [--commit] [--limit=N]
 */

const COMMIT = process.argv.includes("--commit");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : undefined;

const UA = "Mozilla/5.0 (compatible; KeshertoursMigration/1.0)";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

function textOf($el: cheerio.Cheerio<any>): string {
  return $el.text().replace(/\s+/g, " ").trim();
}

/** "#includes .content p" / "#excludes .content p" are bullet lines joined by <br>. */
function bulletLines($: cheerio.CheerioAPI, containerId: string): string[] {
  const html = $(`#${containerId} .content`).first().html() ?? "";
  return html
    .split(/<br\s*\/?>/i)
    .map((line) =>
      line
        .replace(/<[^>]+>/g, "")
        .replace(/&#8211;|&ndash;/g, "-")
        .replace(/&amp;/g, "&")
        .replace(/&#8217;/g, "'")
        .replace(/^[•\s]+/, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

function matchCountries(title: string, slug: string): string[] {
  const haystack = `${title} ${slug}`.toLowerCase();
  const aliases: Record<string, string> = {
    "uae": "United Arab Emirates",
    "usa": "United States",
    "us ": "United States",
    "uk ": "United Kingdom",
    "vietnam": "Vietnam",
    "cambodia": "Cambodia",
    "galapagos": "Ecuador",
  };
  const found = new Set<string>();
  for (const [alias, country] of Object.entries(aliases)) {
    if (haystack.includes(alias)) found.add(country);
  }
  for (const country of COUNTRIES) {
    if (haystack.includes(country.toLowerCase())) found.add(country);
  }
  return Array.from(found);
}

interface ParsedTour {
  slug: string;
  url: string;
  clicks: number;
  oldStatus: string;
  tour: Tour;
  imagesToDownload: { url: string; kind: "hero" | "gallery" }[];
  warnings: string[];
}

function parseTourPage(slug: string, url: string, clicks: number, oldStatus: string, html: string): ParsedTour {
  const $ = cheerio.load(html);
  const warnings: string[] = [];

  // h2.single-sub-title is the short tour name (e.g. "Japan Tour", "Ecuador
  // & The Galapagos Islands"); h1.section_title is a marketing tagline
  // (e.g. "The Japanese Legend..."), not the title — kept as a tagline
  // prefixed onto the summary instead.
  const $subTitle = $(".heading_content h2.single-sub-title").first().clone();
  $subTitle.find(".single-sub-title-days").remove();
  const title = textOf($subTitle) || textOf($("h1.section_title span").first()) || slug;
  const tagline = textOf($("h1.section_title span").first());
  const durationText = textOf($(".single-sub-title-days").first());
  const durationDays = parseInt(durationText, 10) || 1;

  const introPara = textOf($(".heading_content > p").first());
  const extraPara = textOf($("#collapsetourmaincontent p").first());
  const summary = [tagline, introPara].filter(Boolean).join(" — ") || title;
  const description = [introPara, extraPara].filter(Boolean).join("\n\n") || summary;

  const itineraryDays: ItineraryDay[] = [];
  $("#tourroute .panel.panel-default").each((i, panel) => {
    const $panel = $(panel);
    const dayLabel = textOf($panel.find(".day").first());
    const dayNumber = parseInt(dayLabel.match(/\d+/)?.[0] ?? "", 10) || i + 1;
    const dayTitle = textOf($panel.find(".day_title").first()).replace(/^[:\s]+|[:\s]+$/g, "");
    const mainPara = textOf($panel.find(".left_list > p").first());
    const collapsedPara = textOf($panel.find(".panel-collapse p").first());
    const dayDescription = [mainPara, collapsedPara].filter(Boolean).join("\n\n");
    if (dayTitle || dayDescription) {
      itineraryDays.push({
        dayId: String(dayNumber),
        dayNumber,
        title: dayTitle || `Day ${dayNumber}`,
        description: dayDescription,
        meals: [],
      });
    }
  });

  const inclusions = bulletLines($, "includes");
  const exclusions = bulletLines($, "excludes");

  let kashrutNotes = "";
  $('[id="gotoknow"]').each((_, el) => {
    const $el = $(el);
    if (/kashrut/i.test(textOf($el.find("h2").first()))) {
      kashrutNotes = textOf($el.find(".content").first());
    }
  });

  const galleryUrls = new Set<string>();
  $("#sidebar_gallery .gallery a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (href && /wp-content\/uploads\//.test(href)) galleryUrls.add(href);
  });
  const gallery = Array.from(galleryUrls);
  const heroUrl = gallery[0];
  if (!heroUrl) warnings.push("No gallery/hero image found on page.");

  // Price/date rows (empty for "NO TRIPS" pages) — kept as a text note only,
  // never written as a live bookable Departure (see file header).
  const dateRows: string[] = [];
  $(".mixitup .mix.tr").each((_, row) => {
    const $row = $(row);
    const dep = textOf($row.find(".date_start").first());
    const ret = textOf($row.find(".date_end").first());
    const price = textOf($row.find(".date_price").first());
    dateRows.push(`${dep} – ${ret}: ${price}`);
  });
  const legacyPricingNote =
    dateRows.length > 0 ? `\n\n[Legacy pricing on old site as of migration: ${dateRows.join("; ")}]` : "";

  const bodyText = $("body").text();
  const depositMatch = bodyText.match(/\$(\d+(?:,\d{3})?)\s*(?:USD)?\s*Deposit/i);
  const balanceMatch = bodyText.match(/due\s+(\d+)\s+days\s+before\s+departure/i);
  const flightsIncluded = /flights?\s+included/i.test(bodyText) && !/international flights/i.test(exclusions.join(" "));

  const countries = matchCountries(title, slug);
  if (countries.length === 0) warnings.push("No country match — needs manual entry in admin editor.");

  const travelStyle: Tour["travelStyle"] = /cruise/i.test(`${title} ${slug}`) ? "cruise" : "land";

  const imagesToDownload: { url: string; kind: "hero" | "gallery" }[] = gallery.map((g, i) => ({
    url: g,
    kind: i === 0 ? "hero" : "gallery",
  }));

  const tour: Tour = {
    tourId: slug,
    slug,
    title,
    summary,
    description: description + legacyPricingNote,
    heroImage: heroUrl ?? "",
    gallery,
    countries,
    travelStyle,
    themeTags: [],
    durationDays,
    minGroupSize: 0,
    flightsIncluded,
    inclusions,
    exclusions,
    pricing: {
      pricePerPersonDouble: 0,
      pricePerPersonSingle: 0,
      depositAmountPerPerson: depositMatch ? parseInt(depositMatch[1].replace(",", ""), 10) : 0,
      balanceDueDaysBeforeDeparture: balanceMatch ? parseInt(balanceMatch[1], 10) : 60,
    },
    kashrutDetails: {
      supervisionLevel: kashrutNotes ? "Local kosher supervision (migrated from previous site — verify before publishing)" : "Needs confirmation",
      patYisrael: "not_guaranteed",
      chalavYisrael: "not_guaranteed",
      notes: kashrutNotes || undefined,
    },
    itineraryDays,
    status: "archived",
    isLegacyMigrated: true,
  };

  return { slug, url, clicks, oldStatus, tour, imagesToDownload, warnings };
}

async function uploadImageFromUrl(
  storage: ReturnType<typeof getStorage>,
  sourceUrl: string,
  slug: string,
  index: number
): Promise<string> {
  const res = await fetch(sourceUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status} ${sourceUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const extMatch = sourceUrl.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";

  const path = `tours/legacy/${slug}/${index}-${randomUUID()}.${ext}`;
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
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in .env.local.");
  }
  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    // .env.local's NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is empty for local dev —
    // fall back to the project's real default bucket (verified to exist).
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  });
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  const storage = getStorage(app);

  console.log(`Mode: ${COMMIT ? "COMMIT (writing to Firestore + Storage)" : "DRY RUN (no writes)"}`);
  console.log(`Project: ${projectId}`);

  const existingSnap = await db.collection("tours").get();
  const existingSlugs = new Set(existingSnap.docs.map((d) => (d.data() as Tour).slug));
  console.log(`Existing tours in Firestore: ${existingSlugs.size} (${Array.from(existingSlugs).join(", ")})`);

  const source = (legacyTours as { slug: string; url: string; clicks: number; oldStatus: string }[]).slice(
    0,
    LIMIT
  );

  const results: ParsedTour[] = [];
  const skipped: string[] = [];
  const failed: { slug: string; error: string }[] = [];

  for (const entry of source) {
    if (existingSlugs.has(entry.slug)) {
      skipped.push(entry.slug);
      continue;
    }
    try {
      const html = await fetchHtml(entry.url);
      const parsed = parseTourPage(entry.slug, entry.url, entry.clicks, entry.oldStatus, html);
      results.push(parsed);
      console.log(`Parsed ${entry.slug} (${entry.oldStatus}, ${entry.clicks} clicks) — ${parsed.warnings.length} warning(s)`);
    } catch (err) {
      failed.push({ slug: entry.slug, error: String(err) });
      console.error(`FAILED ${entry.slug}: ${err}`);
    }
  }

  if (COMMIT) {
    for (const r of results) {
      const uploaded: string[] = [];
      for (let i = 0; i < r.imagesToDownload.length; i++) {
        try {
          const newUrl = await uploadImageFromUrl(storage, r.imagesToDownload[i].url, r.slug, i);
          uploaded.push(newUrl);
        } catch (err) {
          r.warnings.push(`Image upload failed for ${r.imagesToDownload[i].url}: ${err}`);
        }
      }
      r.tour.heroImage = uploaded[0] ?? "";
      r.tour.gallery = uploaded;
      await db.collection("tours").doc(r.slug).set(r.tour);
      console.log(`Committed ${r.slug} (${uploaded.length} images uploaded).`);
    }
  }

  mkdirSync("scripts/migrate/output", { recursive: true });
  writeFileSync(
    "scripts/migrate/output/tours-preview.json",
    JSON.stringify(
      results.map((r) => ({
        slug: r.slug,
        oldUrl: r.url,
        clicks: r.clicks,
        oldStatus: r.oldStatus,
        warnings: r.warnings,
        tour: r.tour,
      })),
      null,
      2
    ),
    "utf-8"
  );

  const liveCandidates = results.filter((r) => r.oldStatus === "LIVE");

  console.log("\n=== SUMMARY ===");
  console.log(`Skipped (already exist): ${skipped.length} — ${skipped.join(", ")}`);
  console.log(`${COMMIT ? "Committed" : "Would create"} as archived: ${results.length}`);
  console.log(`Failed to fetch/parse: ${failed.length}${failed.length ? " — " + failed.map((f) => f.slug).join(", ") : ""}`);
  console.log(`\nLive on old site but NOT already in Firestore (${liveCandidates.length}) — archived by default, review for publishing:`);
  for (const c of liveCandidates) {
    console.log(`  - ${c.slug} (${c.clicks} clicks, ${c.warnings.length} warning(s))`);
  }
  console.log(`\nFull preview written to scripts/migrate/output/tours-preview.json`);
  if (!COMMIT) console.log("Dry run only — re-run with --commit to write.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
