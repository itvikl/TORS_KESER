import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { mkdirSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import type { ItineraryDay, Tour, TourInfoCard } from "../../lib/types";

/**
 * Re-reads every tour page on the old keshertours.com and fills in what the
 * first migration (scripts/migrate-legacy-tours.ts) and the hand seed left
 * out, compared side by side on 2026-10-22:
 *
 * - Itineraries: italy, morocco and kosher-safari-tanzania were published
 *   with 3–4 placeholder seed days, costa-rica with one-line seed days. Those
 *   (and any tour with fewer days, or much less text, than its old page) get
 *   the old page's full itinerary. Otherwise days are kept and only patched:
 *   a generic "Day N" title takes the old title, and a description the first
 *   migration cut to its first paragraph takes the old page's full text.
 * - The "Need to Know" cards: only Kashrut was migrated. "Important to
 *   Know", "The meals", "Hotels" (and any other card on the old page) are
 *   added as info cards, skipping a title the tour already has; the kashrut
 *   card takes the old card's title and full text when longer.
 * - Inclusions/exclusions: re-parsed with hard-wrapped lines rejoined, for
 *   migrated tours and the four seed placeholders above. Hand-curated lists
 *   only lose their leading "•"/"✓"/"*" glyphs (the page draws its own).
 *
 * Deliberately NOT copied: the old "Deposit, Cancellation Fees & Policy"
 * card. Its terms differ from DEFAULT_CANCELLATION_POLICY_TEXT, which is what
 * lib/cancellationPolicy.ts actually refunds by. Summary, description,
 * pricing, photos and status are left untouched.
 *
 * Defaults to a dry run that writes scripts/migrate/output/tour-details-
 * preview.json. Pass --commit to write to Firestore.
 *
 * Run with: npx tsx scripts/migrate/backfill-legacy-tour-details.ts [--commit]
 */

const COMMIT = process.argv.includes("--commit");
const UA = "Mozilla/5.0 (compatible; KeshertoursMigration/1.0)";
const OLD_SITE = "https://keshertours.com/tours";

/** Firestore slug → old-site slug, where they differ. */
const SOURCE_SLUG: Record<string, string> = {
  italy: "italy-2", // "Tour to Italy" (Rome–Tivoli–Siena–Florence…); old /italy/ is the 8-day South Italy tour
  "kosher-safari-tanzania": "tanzania",
};

/** Published tours still carrying seed placeholder itinerary/inclusions instead of the real old-site content. */
const SEED_PLACEHOLDERS = new Set(["costa-rica", "italy", "morocco", "kosher-safari-tanzania"]);

interface OldSection {
  title: string;
  lines: string[];
}

interface OldTour {
  itinerary: { title: string; paragraphs: string[] }[];
  sections: OldSection[];
}

function clean(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/[ ​-‍﻿]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const BULLET = /^[•✓*❖➢\-–]\s*/;

/** Rejoins the old site's hard-wrapped lines: a line starting in lowercase continues the previous one. */
function joinLines(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    const startsNew = !prev || BULLET.test(line) || !/^[a-z(]/.test(line);
    if (startsNew) out.push(line);
    else out[out.length - 1] = `${prev} ${line}`;
  }
  return out.map((line) => line.replace(BULLET, "").trim()).filter(Boolean);
}

/** A section's <p>s split on <br>, tags stripped. */
function contentLines($: cheerio.CheerioAPI, $content: ReturnType<cheerio.CheerioAPI>): string[] {
  const lines: string[] = [];
  $content.children("p, ul").each((_, el) => {
    const parts =
      el.tagName === "ul"
        ? $(el)
            .children("li")
            .map((_, li) => $(li).html() ?? "")
            .get()
        : ($(el).html() ?? "").split(/<br\s*\/?>/i);
    for (const part of parts) {
      const text = clean(cheerio.load(`<x>${part}</x>`)("x").text());
      if (text) lines.push(text);
    }
  });
  return lines;
}

function parseOldPage(html: string): OldTour {
  const $ = cheerio.load(html);

  const itinerary = $("#tourroute .panel.panel-default")
    .map((_, panel) => {
      const $panel = $(panel);
      const paragraphs = [
        ...$panel.find(".left_list > p").map((_, p) => clean($(p).text())).get(),
        ...$panel.find(".panel-collapse p").map((_, p) => clean($(p).text())).get(),
      ].filter(Boolean);
      const title = clean($panel.find(".day_title").first().text()).replace(/^[:\s]+|[:\s]+$/g, "");
      return { title, paragraphs };
    })
    .get();

  // Each "Need to Know" card is an h2.inner_title followed by its .content.
  // Some pages nest the cards inside each other, so take only the h2's own
  // sibling, and the first card per title.
  const sections: OldSection[] = [];
  $("h2.inner_title").each((_, h2) => {
    const title = clean($(h2).text()).replace(/:$/, "");
    const $content = $(h2).nextAll(".content").first();
    if (!title || sections.some((s) => s.title === title)) return;
    sections.push({ title, lines: contentLines($, $content) });
  });

  return { itinerary, sections };
}

function findSection(old: OldTour, pattern: RegExp): OldSection | undefined {
  return old.sections.find((s) => pattern.test(s.title));
}

const INCLUDES = /^price includes$/i;
const EXCLUDES = /^(price excludes|prices do not include)$/i;
const KASHRUT = /^kashrut/i;
const DEPOSIT = /deposit|cancellation/i;
/**
 * Where an "Important to Know" list turns into the old payment/cancellation
 * terms — dropped from there on, for the same reason as the Deposit card.
 */
const PAYMENT_TERMS = /^(terms of (payment|cancellation)|payment terms|cancellation terms)/i;
/** A bare sub-heading line such as "Notes:" or "Important Remark". */
const SUBHEADING = /^([^.]{0,40}:|important (remark|information))$/i;
/** Lines that only make sense next to the dropped cancellation terms. */
const CANCELLATION_ASIDE = /cancellation fees|not counted as a working day/i;
/** Cards rendered as running text rather than a bullet list. */
const PROSE_CARDS = /^(the meals|hotels)$/i;

function textLength(days: { description?: string; paragraphs?: string[] }[]): number {
  return days.reduce((sum, d) => sum + (d.description ?? d.paragraphs?.join(" ") ?? "").length, 0);
}

function stripGlyphs(items: string[]): string[] {
  return items.map((item) => item.replace(BULLET, "").trim()).filter(Boolean);
}

function buildPatch(tour: Tour, old: OldTour): { patch: Partial<Tour>; changes: string[] } {
  const patch: Partial<Tour> = {};
  const changes: string[] = [];
  const seed = SEED_PLACEHOLDERS.has(tour.slug);

  // Itinerary
  const oldDays = old.itinerary.filter((d) => d.title || d.paragraphs.length);
  if (oldDays.length > 0) {
    const current = tour.itineraryDays ?? [];
    const replaceAll = seed || current.length < oldDays.length || textLength(current) < textLength(oldDays) * 0.6;
    if (replaceAll) {
      patch.itineraryDays = oldDays.map((d, i): ItineraryDay => ({
        dayId: String(i + 1),
        dayNumber: i + 1,
        // The page prints the day number itself, so drop "Day 1, " from titles.
        title: d.title.replace(/^day\s*\d+\s*[,:.\-–]\s*/i, "") || `Day ${i + 1}`,
        description: d.paragraphs.join("\n\n"),
        meals: [],
      }));
      changes.push(`itinerary replaced: ${current.length} → ${oldDays.length} days`);
    } else {
      let patched = 0;
      const days = current.map((day, i) => {
        const o = oldDays[i];
        if (!o) return day;
        const next = { ...day };
        if (/^day\s*\d+$/i.test(day.title.trim()) && o.title && !/^day\s*\d+$/i.test(o.title)) next.title = o.title;
        const oldText = o.paragraphs.join("\n\n");
        if (oldText.length > day.description.length * 1.2 + 20) next.description = oldText;
        if (next.title !== day.title || next.description !== day.description) patched++;
        return next;
      });
      if (patched > 0) {
        patch.itineraryDays = days;
        changes.push(`itinerary: ${patched} day(s) given fuller title/text`);
      }
    }
  }

  // Kashrut card
  const kashrut = findSection(old, KASHRUT);
  if (kashrut) {
    const notes = joinLines(kashrut.lines).join("\n\n");
    const details = { ...tour.kashrutDetails };
    if (!details.title?.trim()) details.title = kashrut.title;
    if (notes.length > (details.notes?.length ?? 0)) details.notes = notes;
    if (details.title !== tour.kashrutDetails.title || details.notes !== tour.kashrutDetails.notes) {
      patch.kashrutDetails = details;
      changes.push(`kashrut: title "${details.title}", notes ${tour.kashrutDetails.notes?.length ?? 0} → ${details.notes?.length ?? 0} chars`);
    }
  }

  // Other "Need to Know" cards
  const existingTitles = new Set((tour.infoCards ?? []).map((c) => c.title.trim().toLowerCase()));
  if ((tour.importantToKnow ?? []).some((item) => item.trim())) existingTitles.add("important to know");
  const newCards: TourInfoCard[] = [];
  for (const section of old.sections) {
    if ([INCLUDES, EXCLUDES, KASHRUT, DEPOSIT].some((re) => re.test(section.title))) continue;
    if (existingTitles.has(section.title.toLowerCase())) continue;
    let items = joinLines(section.lines);
    const cut = items.findIndex((item) => PAYMENT_TERMS.test(item));
    if (cut >= 0) items = items.slice(0, cut);
    items = items.filter((item) => !SUBHEADING.test(item) && !CANCELLATION_ASIDE.test(item));
    if (items.length === 0) continue;
    const prose = PROSE_CARDS.test(section.title);
    newCards.push({
      cardId: section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      title: section.title,
      fields: [],
      notes: prose ? items.join("\n\n") : undefined,
      items: prose ? [] : items,
    });
  }
  if (newCards.length > 0) {
    patch.infoCards = [...(tour.infoCards ?? []), ...newCards];
    changes.push(`cards added: ${newCards.map((c) => c.title).join(", ")}`);
  }

  // Inclusions / exclusions
  for (const [key, re] of [
    ["inclusions", INCLUDES],
    ["exclusions", EXCLUDES],
  ] as const) {
    const current = tour[key] ?? [];
    const section = findSection(old, re);
    const fromOld = section ? joinLines(section.lines) : [];
    let next = stripGlyphs(current);
    if ((tour.isLegacyMigrated || seed) && fromOld.length > 0) next = fromOld;
    if (JSON.stringify(next) !== JSON.stringify(current)) {
      patch[key] = next;
      changes.push(`${key}: ${current.length} → ${next.length} items`);
    }
  }

  return { patch, changes };
}

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in .env.local.");
  }
  const db = getFirestore(initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }));
  db.settings({ ignoreUndefinedProperties: true });

  console.log(`Mode: ${COMMIT ? "COMMIT (writing to Firestore)" : "DRY RUN (no writes)"} | project: ${projectId}`);

  const snap = await db.collection("tours").get();
  const preview: { slug: string; status: string; source: string; changes: string[]; patch: Partial<Tour> }[] = [];
  const noSource: string[] = [];

  for (const doc of snap.docs) {
    const tour = doc.data() as Tour;
    const sourceSlug = SOURCE_SLUG[tour.slug] ?? tour.slug;
    const res = await fetch(`${OLD_SITE}/${sourceSlug}/`, { headers: { "User-Agent": UA } });
    const old = res.ok ? parseOldPage(await res.text()) : undefined;
    if (!old || old.itinerary.length === 0) {
      noSource.push(`${tour.slug} (${tour.status})`);
      continue;
    }
    const { patch, changes } = buildPatch(tour, old);
    if (changes.length === 0) continue;
    preview.push({ slug: tour.slug, status: tour.status, source: sourceSlug, changes, patch });
    console.log(`\n${tour.slug} [${tour.status}] ← /tours/${sourceSlug}/`);
    for (const change of changes) console.log(`  - ${change}`);
    if (COMMIT) await doc.ref.update(patch);
  }

  mkdirSync("scripts/migrate/output", { recursive: true });
  writeFileSync("scripts/migrate/output/tour-details-preview.json", JSON.stringify(preview, null, 2), "utf-8");

  console.log(`\n=== SUMMARY ===`);
  console.log(`${COMMIT ? "Updated" : "Would update"}: ${preview.length} tour(s)`);
  console.log(`No old-site page (left as is): ${noSource.join(", ") || "none"}`);
  console.log(`Preview: scripts/migrate/output/tour-details-preview.json`);
  if (!COMMIT) console.log("Dry run only — re-run with --commit to write.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
