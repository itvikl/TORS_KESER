import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { ADMIN_ROLES, isAdminRole } from "../lib/auth/roles";

/**
 * Bootstraps admin/staff access by setting a Firebase Auth custom claim
 * (read by proxy.ts and lib/auth/dal.ts) and mirroring the role onto the
 * user's Firestore doc (PRD section 8 users/{userId}.role).
 *
 * Day to day, developers and super admins manage roles on Admin accounts
 * (/admin/staff/accounts). This script is for bootstrapping the first
 * developer/super admin, or recovering if nobody can manage accounts.
 * Roles: developer, super_admin, admin, staff, seo_admin (lib/auth/roles.ts).
 *
 * Run with: npm run set-role -- someone@example.com super_admin
 */
async function main() {
  const [email, role] = process.argv.slice(2);

  if (!email || !role) {
    throw new Error(`Usage: npm run set-role -- <email> <${ADMIN_ROLES.join("|")}>`);
  }
  if (!isAdminRole(role)) {
    throw new Error(`Invalid role "${role}" — must be one of: ${ADMIN_ROLES.join(", ")}.`);
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
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, role });
  // Ends their current sessions so the new permissions apply right away.
  await auth.revokeRefreshTokens(user.uid);
  await db.collection("users").doc(user.uid).set(
    { email: user.email, role },
    { merge: true }
  );

  console.log(`Set role "${role}" for ${email} (${user.uid}).`);
  console.log("Their current sessions were ended — they sign in again to get the new role.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
