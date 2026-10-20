import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { passportScanPathOf, PASSPORT_SCANS_PREFIX } from "../lib/passportScans";

/**
 * One-off: makes passport scans uploaded before they went private unreadable
 * by URL. Strips the public download token from every object under
 * passport-scans/ (which kills any old tokenized link, wherever it was
 * copied), and rewrites each traveler's legacy `passportScanUrl` into
 * `passportScanPath` so the admin route keeps opening it.
 *
 * Dry run by default — prints what it would change. Pass --apply to write.
 *   npx tsx scripts/secure-passport-scans.ts            # dry run
 *   npx tsx scripts/secure-passport-scans.ts --apply
 */
async function main() {
  const apply = process.argv.includes("--apply");

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    throw new Error("Missing Firebase Admin credentials or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local.");
  }

  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), storageBucket });
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket();

  const [files] = await bucket.getFiles({ prefix: PASSPORT_SCANS_PREFIX });
  let tokensRemoved = 0;
  for (const file of files) {
    const [metadata] = await file.getMetadata();
    if (!metadata.metadata?.firebaseStorageDownloadTokens) continue;
    tokensRemoved += 1;
    if (apply) {
      await file.setMetadata({
        cacheControl: "private, no-store",
        metadata: { firebaseStorageDownloadTokens: null },
      });
    }
  }

  const travelers = await db.collectionGroup("travelers").get();
  let travelersMigrated = 0;
  for (const doc of travelers.docs) {
    const data = doc.data() as { passportScanUrl?: string; passportScanPath?: string };
    if (!data.passportScanUrl) continue;
    const path = passportScanPathOf(data);
    if (!path) {
      console.warn(`Unrecognized passportScanUrl on ${doc.ref.path} — left as is.`);
      continue;
    }
    travelersMigrated += 1;
    if (apply) {
      await doc.ref.update({ passportScanPath: path, passportScanUrl: null });
    }
  }

  console.log(
    `${apply ? "Applied" : "Dry run"}: ${files.length} scan(s) in Storage, ` +
      `${tokensRemoved} public token(s) ${apply ? "removed" : "to remove"}, ` +
      `${travelersMigrated} traveler(s) ${apply ? "migrated" : "to migrate"}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
