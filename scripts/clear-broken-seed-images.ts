import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * One-time cleanup: the original seed data (lib/data/seed/tours.seed.ts)
 * pointed heroImage/gallery at local paths like "/tours/costa-rica/hero.jpg"
 * that were never actually added under public/ — no real photography was
 * ever sourced for these tours (PRD open question Q10). Those 404 in the
 * browser console on every page that renders the tour.
 *
 * This blanks ONLY fields still holding that placeholder pattern, so
 * `tour.heroImage || tour.gallery[0] || <stock placeholder>`
 * (app/(marketing)/page.tsx) falls through to the stock placeholder
 * instead. Tours already fixed via the admin editor (real uploaded
 * https:// URLs) are left untouched.
 *
 * Run with: npm run clear-broken-seed-images
 */
const BROKEN_PATH_PREFIX = "/tours/";

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
  let changed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const heroImage: string = data.heroImage ?? "";
    const gallery: string[] = Array.isArray(data.gallery) ? data.gallery : [];

    const heroIsBroken = heroImage.startsWith(BROKEN_PATH_PREFIX);
    const cleanedGallery = gallery.filter((src) => !src.startsWith(BROKEN_PATH_PREFIX));

    if (!heroIsBroken && cleanedGallery.length === gallery.length) continue;

    batch.update(doc.ref, {
      heroImage: heroIsBroken ? "" : heroImage,
      gallery: cleanedGallery,
    });
    changed++;
    console.log(`Cleared broken image paths for "${data.title}" (${doc.id}).`);
  }

  if (changed === 0) {
    console.log("No broken seed image paths found — nothing to do.");
    return;
  }

  await batch.commit();
  console.log(`Done — updated ${changed} tour(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
