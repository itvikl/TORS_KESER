import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Bootstraps admin/staff access by setting a Firebase Auth custom claim
 * (read by proxy.ts and lib/auth/dal.ts) and mirroring the role onto the
 * user's Firestore doc (PRD section 8 users/{userId}.role).
 *
 * There's no admin UI for staff management yet (PRD FR-30) — this script is
 * the only way to grant the first admin account access to /admin.
 *
 * Run with: npm run set-role -- someone@example.com admin
 */
async function main() {
  const [email, role] = process.argv.slice(2);

  if (!email || !role) {
    throw new Error("Usage: npm run set-role -- <email> <staff|admin>");
  }
  if (role !== "staff" && role !== "admin") {
    throw new Error(`Invalid role "${role}" — must be "staff" or "admin".`);
  }

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
  const auth = getAuth(app);
  const db = getFirestore(app);

  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { role });
  await db.collection("users").doc(user.uid).set(
    { email: user.email, role },
    { merge: true }
  );

  console.log(`Set role "${role}" for ${email} (${user.uid}).`);
  console.log("They must sign out and back in for the new claim to take effect.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
