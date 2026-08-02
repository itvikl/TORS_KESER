import "server-only";

/**
 * Firebase ADMIN SDK — server-only, never bundled to the client.
 * This is the security boundary described in PRD section 9: every write
 * that touches money (capacity, booking status, payments) must go through
 * Server Actions/Route Handlers that use this module, never the client SDK.
 *
 * Import guard: the `server-only` package makes any accidental import of
 * this file from a Client Component fail at build time.
 */
import { cert, getApps, getApp, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getAdminApp(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  // Applied here (synchronously, immediately after the app is created —
  // the `getApps().length` guard above means this branch runs exactly
  // once per process) rather than lazily inside adminDb(). Next.js can run
  // a page's generateMetadata and the page component concurrently for the
  // same request; both call adminDb(), and a "call settings() once, lazily,
  // on first use" flag there is a TOCTOU race — both calls can see the flag
  // unset and one throws "Firestore has already been initialized."
  //
  // Lets callers build write payloads with optional fields left as
  // `undefined` (e.g. Booking.contactPhone) instead of having to strip them
  // by hand — Firestore otherwise rejects `undefined` values.
  getFirestore(app).settings({ ignoreUndefinedProperties: true });

  return app;
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

export function adminStorage() {
  return getStorage(getAdminApp());
}
