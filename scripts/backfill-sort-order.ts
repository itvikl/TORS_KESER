import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Tour } from "../lib/types";

/**
 * One-time backfill for the new Tour.sortOrder field (drag-and-drop tour
 * ordering). Existing tours have no sortOrder yet; this assigns one based
 * on today's default display order (alphabetical by title) as a reasonable
 * starting point — staff can then re-order via drag-and-drop in the admin
 * tours list. Safe to re-run: it always re-derives order from title.
 *
 * Run with: npm run backfill-sort-order
 */
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
  const tours = snapshot.docs.map((doc) => doc.data() as Tour);
  tours.sort((a, b) => a.title.localeCompare(b.title));

  const batch = db.batch();
  tours.forEach((tour, index) => {
    batch.update(db.collection("tours").doc(tour.tourId), { sortOrder: index });
  });
  await batch.commit();

  console.log(`Backfilled sortOrder on ${tours.length} tours.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
