import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Turns on TOTP (authenticator app) multi-factor auth for the Firebase
 * project, so admins can enroll from the sign-in page (components/admin/LoginForm).
 * Also marks admin/staff emails as verified — Firebase refuses MFA
 * enrollment for unverified emails, and accounts made with set-user-role.ts
 * may not be.
 *
 * Prerequisite: the project must be upgraded to "Firebase Authentication
 * with Identity Platform" (Firebase console → Authentication → Settings).
 * After this succeeds and every admin has enrolled (Admin accounts shows
 * 2FA: On), set ADMIN_REQUIRE_2FA=true in apphosting.yaml to enforce it.
 *
 * Run with: npx tsx scripts/enable-admin-2fa.ts
 */
async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in .env.local.");
  }

  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const auth = getAuth(app);

  await auth.projectConfigManager().updateProjectConfig({
    multiFactorConfig: {
      state: "ENABLED",
      providerConfigs: [{ state: "ENABLED", totpProviderConfig: { adjacentIntervals: 1 } }],
    },
  });
  console.log("TOTP multi-factor auth enabled for the project.");

  const admins = await getFirestore(app).collection("users").where("role", "in", ["staff", "admin"]).get();
  for (const doc of admins.docs) {
    const user = await auth.getUser(doc.id).catch(() => null);
    if (user && !user.emailVerified) {
      await auth.updateUser(user.uid, { emailVerified: true });
      console.log(`Marked ${user.email} as verified.`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
