import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";
import type { Tour } from "../../lib/types";
import { storageDownloadUrl } from "../../lib/media/assets";

/**
 * One-off: finishes the half-migrated "new-zealand-and-australia" tour from
 * keshertours.com/tours/new-zealand-and-australia/. The first migration left
 * the title/summary/description as the slug, no photos, and the "Need to
 * Know" exclusions split mid-sentence; the Important to Know, deposit/
 * cancellation, force majeure and kashrut/meals text was never brought over.
 *
 * Text below is the old page's, with its hard line wraps rejoined. The
 * summary and description are new (the old page had none) — written from the
 * itinerary, review before publishing. The tour stays archived; publish it
 * from the admin editor. Run `npm run index-media-library -- --commit`
 * afterwards so the copied photos show in the image library.
 *
 * Run with: npx tsx scripts/migrate/fix-australia-tour.ts [--commit]
 */

const COMMIT = process.argv.includes("--commit");
const TOUR_ID = "new-zealand-and-australia";
const UA = "Mozilla/5.0 (compatible; KeshertoursMigration/1.0)";

const UPLOADS = "https://keshertours.com/wp-content/uploads/2021/09";
// The page's own "australia-main.jpg" is only 436x250 — too small for the hero
// banner — so the 800px New Zealand mountain-road photo leads and it joins the
// gallery. Full-size originals (the page links 800x541 thumbnails for some).
const HERO = `${UPLOADS}/New-Zealand-1.jpg`;
const GALLERY = [
  `${UPLOADS}/australia-main.jpg`,
  ...[4, 5, 6, 7].map((n) => `${UPLOADS}/New-Zealand-${n}.jpg`),
];

const patch: Partial<Tour> = {
  title: "Australia & New Zealand",
  countries: ["Australia", "New Zealand"],
  summary:
    "18 days across Australia and New Zealand — Sydney and the Blue Mountains, Melbourne and the Great Ocean Road, Auckland, Rotorua and the Waitomo glowworm caves, then Queenstown, Milford Sound, the West Coast and Christchurch.",
  description: [
    "Our journey begins in Sydney, with the Harbour Bridge, the Opera House, Bondi Beach and a day among the eucalyptus forests of the Blue Mountains. From there we fly to Melbourne, visit its Jewish Museum, spend Shabbat in the city, and drive the spectacular Great Ocean Road.",
    "In New Zealand we start in Auckland, the “City of Sails”, and head to Rotorua’s geothermal reserves and the glowworm caves of Waitomo. On the South Island we stay in Queenstown on Lake Wakatipu, visit historic Arrowtown, cruise Milford Sound, cross Haast Pass to the Pancake Rocks of Punakaiki, and end in Christchurch via Arthur’s Pass National Park.",
  ].join("\n\n"),
  minGroupSize: 20,
  exclusions: [
    "International flights",
    "Israeli passports: Australian Visa (approximately $100) — from application, the visa may take as long as 45 days and your passport must have validity for at least 6 months.",
    "USA passports: need an Electronic Travel Authority (ETA), also called subclass 601. The ETA is easy to obtain and is entirely online.",
    "New Zealand: an electronic travel authorization (eTA or eVisa) must be acquired prior to entry.",
    "Travel insurance for health and luggage",
    "Personal expenses — drinks not included in the meals, laundry, other purchases",
    "Tip for the tour guide, recommended $5 per person, per day",
    "Shows or events not included in the itinerary",
  ],
  importantToKnow: [
    "The price of the tour is based on the participation of a minimum of 20 paying passengers.",
    "With any change, cancellation, or problem related to flights, to the cruise, or traffic, the responsibility is on the airline or company providing the service.",
    "There may be changes in the itinerary because of circumstances that we do not control.",
    "The production of the tour is dependent on the responsibilities and conditions that appear on the Kesher website www.keshertours.com.",
    "Your passport must be valid for at least 6 months beyond the end of the tour.",
    "Increases in flight and fuel costs may affect the price of the tour.",
  ],
  cancellationPolicy: [
    "A $500 USD deposit per person must be received at the time of booking in order to confirm your reservation. Payment in full is due 60 days before departure.",
    "A minimum number of participants is required to operate tour dates. If a minimum number has not been reached prior to tour departure and the tour is cancelled, you will receive a FULL refund.",
    "60 days or more before departure: bookings are refundable less a $100 administration fee.",
    "59–30 days prior to departure: 25% of total.",
    "29–15 days prior to departure: 50% of total.",
    "Less than 14 working days prior to departure: 100% of total — no refund.",
    "We strongly recommend purchasing travel insurance.",
    "Cancellation terms and limitation of liability – force majeure events: The company makes every effort to operate the tour as planned. However, the company shall not be held liable for any changes, delays, cancellations, shortening, or extension of the tour resulting from events beyond its control and constituting force majeure, including but not limited to: war, security situations, terrorism, military reserve duty, flight cancellations, border closures, strikes, pandemics, natural disasters, extreme weather conditions, instructions or directives issued by authorities, or any other exceptional event. In the event of a cancellation or change due to force majeure, the company shall be entitled, depending on the circumstances, to modify the tour itinerary, departure dates, service providers, or cancel the tour altogether. Any refund, if granted, shall be based on the amounts actually refunded by service providers abroad, less cancellation fees, commissions, expenses, and any non-refundable commitments or costs. The company shall not be liable for any indirect expenses or damages of any kind, including personal expenses incurred due to an extended stay abroad as a result of a cancelled return flight. Each traveler is strongly advised to purchase appropriate travel insurance that includes coverage for trip cancellation and force majeure events. Registration for the tour and payment constitute full acceptance of these terms.",
  ].join("\n"),
};

const KASHRUT_NOTES = [
  "Kosher food is provided to our travelers on all our tours. We work with the local Rabbinate to provide Hashgacha for all local ingredients and fresh meat and poultry. In some cases, we fly in kosher food from Israel and other sources, depending on the destination of the tour. We do not guarantee Pat Israel and Chalav Israel for all destinations. In many destinations we have our own crockery and cutlery. Where we don’t, we provide disposables at the meals. When we cook in hotel kitchens, we ensure proper Kashering and we use our own kitchenware on kashered and covered surfaces. All this is done under the strict supervision of our trained staff/guides that function as our Mashgichim.",
  "Breakfast is prepared using our utensils. We use local fresh fruits and vegetables, and we use milk products when they are permitted. We use kosher cereals and bread. We usually serve hard boiled eggs and sometimes scrambled eggs or omelets. At breakfast, we prepare our lunches so that people have their choice as to what they eat for lunch. We bring food from Israel to supplement what is served in the hotel such as cheeses, peanut butter, tuna, etc.",
  "For dinners, we serve either fish or meat (usually chicken) as our main course. In areas where meat is not available nor readily acquired, we will have fish. When possible, we acquire the meat locally from Chabad or other reliable kosher source, and in some cases we fly the meat in from Israel. We try to provide as many meat meals as possible. The main course at dinner is preceded by soup and salad and accompanied by freshly prepared vegetables. Dessert typically consists of fresh fruits.",
  "On most of our tours, you will be accompanied by two of our staff members — one a guide for the tour who is knowledgeable about the places you are visiting and will accompany you throughout the day, and the second, a person who will deal with the logistics of the tour and provide kashrut supervision in the kitchen.",
].join("\n\n");

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
  const bucket = getStorage(app).bucket();
  const ref = db.collection("tours").doc(TOUR_ID);
  const tour = (await ref.get()).data() as Tour | undefined;
  if (!tour) throw new Error(`Tour ${TOUR_ID} not found`);

  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"} | tour: ${TOUR_ID} (status: ${tour.status})`);
  for (const [key, value] of Object.entries(patch)) {
    const before = JSON.stringify((tour as unknown as Record<string, unknown>)[key] ?? null);
    console.log(`  ${key}: ${before.slice(0, 60)}… → ${JSON.stringify(value).slice(0, 80)}…`);
  }
  console.log(`  kashrutDetails.notes + supervisionLevel: updated from the old page`);
  console.log(`  photos to copy: hero + ${GALLERY.length} gallery (currently hero: ${!!tour.heroImage}, gallery: ${tour.gallery?.length ?? 0})`);

  if (!COMMIT) {
    console.log("\nDry run — nothing written. Re-run with --commit.");
    return;
  }

  async function copyPhoto(sourceUrl: string): Promise<string | undefined> {
    const res = await fetch(sourceUrl, { headers: { "User-Agent": UA } });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.startsWith("image/")) {
      console.log(`  photo failed (${res.status}): ${sourceUrl}`);
      return undefined;
    }
    const path = `tours/legacy/${TOUR_ID}/${randomUUID()}.jpg`;
    const token = randomUUID();
    await bucket.file(path).save(Buffer.from(await res.arrayBuffer()), {
      contentType,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    return storageDownloadUrl(bucket.name, path, token);
  }

  const heroImage = tour.heroImage || (await copyPhoto(HERO));
  const gallery = tour.gallery?.length
    ? tour.gallery
    : (await Promise.all(GALLERY.map(copyPhoto))).filter((u): u is string => !!u);

  await ref.update({
    ...patch,
    heroImage: heroImage ?? "",
    gallery,
    "kashrutDetails.supervisionLevel":
      "Local Rabbinate hashgacha; our trained staff act as mashgichim",
    "kashrutDetails.notes": KASHRUT_NOTES,
  });
  console.log(`Done. Hero: ${heroImage ? "set" : "missing"}, gallery: ${gallery.length} photo(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
