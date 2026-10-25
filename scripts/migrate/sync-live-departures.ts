import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { Departure, Tour } from "../../lib/types";

/**
 * One-off (2026-10-25): makes the live tour dates match the office CRM's
 * "Self Operation Tours" list plus the future dates still listed on the old
 * keshertours.com pages, with the old site's prices.
 *
 * - Every departure below is created or updated. Capacity comes from the
 *   CRM's ORG column when it is set; otherwise an existing departure keeps
 *   its capacity and a new one gets 0 (to be filled in from the admin).
 *   capacityBooked is recounted from the departure's active bookings, and
 *   the seeded figures are dropped.
 * - Every other departure is removed: deleted when it has no bookings,
 *   otherwise cancelled, so its booking records stay intact.
 * - Tours with dates are published; published tours left with none are
 *   archived.
 * - Migration leftovers are stripped from every tour: the "[Legacy pricing
 *   …]" description note, the "(migrated from previous site — verify…)"
 *   kashrut supervision text, and the Migrated badge on published tours.
 *
 * Defaults to a dry run. Pass --commit to write.
 *
 * Run with: npx tsx scripts/migrate/sync-live-departures.ts [--commit]
 */

const COMMIT = process.argv.includes("--commit");

interface DepartureSpec {
  start: string;
  end: string;
  /** CRM ORG column; undefined when the CRM shows 0 and the old site has none. */
  capacity?: number;
  guide?: string;
}

interface TourSpec {
  title?: string;
  /** From the old site. Single = its double price plus its single supplement. Undefined keeps the current value. */
  double?: number;
  single?: number;
  child?: number | null;
  /** null = the old site states none: left blank (0). */
  deposit?: number | null;
  departures: DepartureSpec[];
}

const LIVE: Record<string, TourSpec> = {
  "brazil-argentina-tour": {
    double: 9490,
    single: 9490 + 2225,
    child: null,
    deposit: 500,
    departures: [
      { start: "2026-11-03", end: "2026-11-15" },
      { start: "2027-01-05", end: "2027-01-17", capacity: 26 },
    ],
  },
  japan: {
    double: 5990,
    child: null,
    deposit: 500,
    departures: [
      { start: "2026-11-09", end: "2026-11-18" },
      { start: "2027-06-14", end: "2027-06-23", capacity: 21 },
    ],
  },
  "ecuador-the-galapagos-islands": {
    double: 7890,
    single: 7890 + 3840,
    deposit: 500,
    departures: [
      { start: "2026-12-23", end: "2027-01-03" },
      { start: "2027-01-27", end: "2027-02-08" },
    ],
  },
  "costa-rica": {
    double: 2895,
    single: 2895 + 856,
    child: 2675,
    deposit: 300,
    departures: [
      { start: "2027-01-19", end: "2027-01-26", capacity: 30, guide: "Avi Feldman" },
      { start: "2027-03-09", end: "2027-03-16", capacity: 30, guide: "Avi Feldman" },
    ],
  },
  "vietnam-cambodia": {
    departures: [{ start: "2027-01-21", end: "2027-02-03", capacity: 21 }],
  },
  "new-zealand-and-australia": {
    double: 11795,
    single: 11795 + 2470,
    deposit: 500,
    departures: [{ start: "2026-10-26", end: "2026-11-12" }],
  },
  "united-arab-emirates": {
    double: 2980,
    single: 2980 + 995,
    deposit: 500,
    departures: [{ start: "2026-10-28", end: "2026-11-04" }],
  },
  "india-2": {
    title: "India",
    double: 4590,
    single: 4590 + 1100,
    deposit: null,
    departures: [{ start: "2027-02-15", end: "2027-02-25", guide: "Amira Ilan" }],
  },
};

const LEGACY_PRICING_NOTE = /\s*\[Legacy pricing on old site as of migration:[^\]]*\]/g;
const MIGRATED_SUPERVISION = /migrated from previous site|^needs confirmation$/i;
const SUPERVISION = "Local Rabbinate hashgacha; our trained staff act as mashgichim";

function subtractDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in .env.local.");
  }
  const db = getFirestore(initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }));
  console.log(`Mode: ${COMMIT ? "COMMIT (writing to Firestore)" : "DRY RUN (no writes)"} | project: ${projectId}\n`);

  const [tourSnap, depSnap, bookingSnap, staffSnap] = await Promise.all([
    db.collection("tours").get(),
    db.collection("departures").get(),
    db.collection("bookings").get(),
    db.collection("staff").get(),
  ]);
  const tours = tourSnap.docs.map((d) => ({ ref: d.ref, id: d.id, tour: d.data() as Tour }));
  const staffIdByName = new Map(staffSnap.docs.map((d) => [(d.data() as { name: string }).name, d.id]));
  const departures = depSnap.docs.map((d) => ({ ref: d.ref, dep: d.data() as Departure }));
  const activeBookings = bookingSnap.docs
    .map((d) => d.data() as { departureId: string; status: string; travelerCount?: number })
    .filter((b) => !/cancel|refund/.test(b.status));
  const bookingsOn = (departureId: string) => activeBookings.filter((b) => b.departureId === departureId);
  const allBookingsOn = (departureId: string) =>
    bookingSnap.docs.filter((d) => (d.data() as { departureId: string }).departureId === departureId).length;

  const batch = db.batch();
  const keptDepartureIds = new Set<string>();

  for (const [slug, spec] of Object.entries(LIVE)) {
    const entry = tours.find((t) => t.tour.slug === slug);
    if (!entry) throw new Error(`Tour ${slug} not found`);
    const { ref, id: tourId, tour } = entry;
    const balanceDays = tour.pricing.balanceDueDaysBeforeDeparture;
    console.log(`${slug} → published`);

    const tourPatch: Record<string, unknown> = { status: "published", isLegacyMigrated: FieldValue.delete() };
    if (spec.title) tourPatch.title = spec.title;
    if (spec.double !== undefined) tourPatch["pricing.pricePerPersonDouble"] = spec.double;
    if (spec.single !== undefined) tourPatch["pricing.pricePerPersonSingle"] = spec.single;
    if (spec.child !== undefined) {
      tourPatch["pricing.childPrice"] = spec.child ?? FieldValue.delete();
      // The old site prices no 3rd adult; drop any seeded triple rate with the child one.
      if (spec.child === null) tourPatch["pricing.pricePerPersonTriple"] = FieldValue.delete();
    }
    if (spec.deposit !== undefined) tourPatch["pricing.depositAmountPerPerson"] = spec.deposit ?? 0;
    console.log(
      `  price: double ${tour.pricing.pricePerPersonDouble} → ${spec.double ?? "same"}, single ${tour.pricing.pricePerPersonSingle} → ${spec.single ?? "same"}, deposit ${tour.pricing.depositAmountPerPerson} → ${spec.deposit === undefined ? "same" : (spec.deposit ?? "blank")}${spec.child !== undefined ? `, child → ${spec.child ?? "removed"}` : ""}`
    );
    batch.update(ref, tourPatch);

    for (const d of spec.departures) {
      const guideId = d.guide ? staffIdByName.get(d.guide) : undefined;
      if (d.guide && !guideId) throw new Error(`Guide ${d.guide} not in staff`);
      // Prefer the departure id the admin would have generated; fall back to any same-date match.
      const matches = departures.filter((x) => x.dep.tourId === tourId && x.dep.startDate.slice(0, 10) === d.start);
      const existing =
        matches.find((x) => x.dep.departureId === `${slug.replace(/-tour$/, "")}-${d.start}`) ??
        matches.sort((a, b) => bookingsOn(b.dep.departureId).length - bookingsOn(a.dep.departureId).length)[0];
      const booked = existing ? bookingsOn(existing.dep.departureId).reduce((s, b) => s + (b.travelerCount ?? 0), 0) : 0;
      const capacityTotal = d.capacity ?? existing?.dep.capacityTotal ?? 0;
      const fields = {
        tourId,
        startDate: d.start,
        endDate: d.end,
        balanceDueDate: subtractDays(d.start, balanceDays),
        capacityTotal,
        capacityBooked: booked,
        capacityHeld: 0,
        status: "open" as const,
        ...(guideId ? { guideId } : {}),
      };
      if (existing) {
        keptDepartureIds.add(existing.dep.departureId);
        batch.update(existing.ref, fields);
        console.log(
          `  keep   ${d.start} → ${d.end} [${existing.dep.departureId}] capacity ${existing.dep.capacityTotal} → ${capacityTotal}, booked ${existing.dep.capacityBooked} → ${booked}, status ${existing.dep.status} → open${d.guide ? `, guide ${d.guide}` : ""}`
        );
      } else {
        const newRef = db.collection("departures").doc();
        const departure: Departure = { ...fields, departureId: newRef.id, minGroupSizeMet: false };
        batch.set(newRef, departure);
        console.log(`  create ${d.start} → ${d.end} capacity ${capacityTotal}${d.guide ? `, guide ${d.guide}` : ""}`);
      }
    }
  }

  // Remove every other departure.
  const slugOf = new Map(tours.map((t) => [t.id, t.tour.slug]));
  console.log(`\nRemoved departures:`);
  for (const { ref, dep } of departures) {
    if (keptDepartureIds.has(dep.departureId) || dep.status === "cancelled") continue;
    const tourSlug = slugOf.get(dep.tourId);
    const spec = tourSlug ? LIVE[tourSlug] : undefined;
    // A new same-date departure created above isn't in `departures`; only skip ones the loop kept.
    const count = allBookingsOn(dep.departureId);
    if (count > 0) batch.update(ref, { status: "cancelled" });
    else batch.delete(ref);
    console.log(
      `  ${count > 0 ? `cancel (${count} booking${count === 1 ? "" : "s"})` : "delete"} ${tourSlug} ${dep.startDate.slice(0, 10)} [${dep.departureId}]${spec ? "" : ""}`
    );
  }

  // Archive published tours with no dates left; strip migration notes everywhere.
  console.log(`\nOther tour changes:`);
  for (const { ref, tour } of tours) {
    const patch: Record<string, unknown> = {};
    if (tour.status === "published" && !LIVE[tour.slug]) patch.status = "archived";
    const description = tour.description.replace(LEGACY_PRICING_NOTE, "");
    if (description !== tour.description) patch.description = description;
    if (MIGRATED_SUPERVISION.test(tour.kashrutDetails.supervisionLevel)) {
      patch["kashrutDetails.supervisionLevel"] = SUPERVISION;
    }
    if (Object.keys(patch).length === 0) continue;
    batch.update(ref, patch);
    console.log(`  ${tour.slug}: ${Object.keys(patch).map((k) => (k === "status" ? `status → ${patch.status}` : k)).join(", ")}`);
  }

  if (COMMIT) {
    await batch.commit();
    console.log("\nCommitted.");
  } else {
    console.log("\nDry run only — re-run with --commit to write.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
