import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * One-time backfill for the new Tour.countries field, replacing the removed
 * Tour.region (continent) field. Existing tours predate `countries` entirely,
 * so this maps each by tourId to the country/countries implied by its title.
 * Safe to re-run: it always re-derives from this fixed map. New tours going
 * forward set countries directly in the admin editor.
 *
 * Run with: npm run backfill-tour-countries
 */
const COUNTRIES_BY_TOUR_ID: Record<string, string[]> = {
  "brazil-argentina": ["Argentina", "Brazil"],
  "costa-rica": ["Costa Rica"],
  lDt0CuhttftMIrjrHG0r: ["Israel"],
  italy: ["Italy"],
  japan: ["Japan"],
  morocco: ["Morocco"],
  portugal: ["Portugal"],
  "tanzania-safari": ["Tanzania"],
  "vietnam-cambodia": ["Vietnam", "Cambodia"],
};

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local."
    );
  }

  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const db = getFirestore(app);

  const snapshot = await db.collection("tours").get();
  const batch = db.batch();
  let updated = 0;
  const skipped: string[] = [];

  for (const doc of snapshot.docs) {
    const countries = COUNTRIES_BY_TOUR_ID[doc.id];
    if (!countries) {
      skipped.push(doc.id);
      continue;
    }
    batch.update(doc.ref, { countries });
    updated++;
  }

  await batch.commit();

  console.log(`Backfilled countries on ${updated} tours.`);
  if (skipped.length > 0) {
    console.log(`Skipped (no mapping — needs manual entry in admin): ${skipped.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
