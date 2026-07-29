import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { TOURS, DEPARTURES } from "../lib/data/seed/tours.seed";

/**
 * One-time/idempotent push of the seed content into Firestore.
 * Run with: npm run seed
 *
 * Initializes firebase-admin directly (rather than importing
 * lib/firebase/admin.ts) because that module is guarded by the
 * "server-only" package, which throws when loaded outside Next.js's
 * react-server bundling condition — this script runs under plain Node/tsx.
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
  const batch = db.batch();

  for (const tour of TOURS) {
    batch.set(db.collection("tours").doc(tour.tourId), tour);
  }
  for (const departure of DEPARTURES) {
    batch.set(db.collection("departures").doc(departure.departureId), departure);
  }

  await batch.commit();
  console.log(`Seeded ${TOURS.length} tours and ${DEPARTURES.length} departures.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
