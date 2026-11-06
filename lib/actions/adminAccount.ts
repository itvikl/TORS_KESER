"use server";

import * as z from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ADMIN_ROLES } from "@/lib/auth/constants";
import { emailFrom, resendClient } from "@/lib/email/resend";
import { adminPasswordResetEmail } from "@/lib/email/templates/adminPasswordReset";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Throttle record per account in adminPasswordResets/{uid} (Admin SDK only;
 * Firestore rules deny clients) — stops the public "Forgot password?" form
 * from being used to flood an admin's inbox.
 */
const COLLECTION = "adminPasswordResets";
const RESEND_AFTER_MS = 60 * 1000;

export type RequestPasswordResetResult = { ok: true } | { ok: false; error: string };

/**
 * "Forgot password?" on the admin sign-in page. Called signed-out, so it
 * answers the same whether or not the email belongs to an admin — it never
 * reveals which addresses have accounts. Only admin/staff logins get an
 * email; it's sent through Resend (branded) with a Firebase reset link.
 */
export async function requestAdminPasswordReset(email: unknown): Promise<RequestPasswordResetResult> {
  const parsed = z.email().safeParse(typeof email === "string" ? email.trim() : email);
  if (!parsed.success) return { ok: false, error: "Enter a valid email." };

  try {
    const user = await adminAuth().getUserByEmail(parsed.data).catch(() => null);
    const role = user?.customClaims?.role;
    if (!user?.email || !ADMIN_ROLES.includes(role)) return { ok: true };

    const throttleRef = adminDb().collection(COLLECTION).doc(user.uid);
    const last = (await throttleRef.get()).data() as { sentAt?: number } | undefined;
    if (last?.sentAt && Date.now() - last.sentAt < RESEND_AFTER_MS) return { ok: true };

    // Returning to the sign-in page needs SITE_URL's domain on Firebase's
    // authorized-domains list; without it, fall back to a plain link.
    const link = await adminAuth()
      .generatePasswordResetLink(user.email, { url: `${SITE_URL}/admin/login` })
      .catch(() => adminAuth().generatePasswordResetLink(user.email!));

    await throttleRef.set({ sentAt: Date.now() });
    const { subject, html, text } = adminPasswordResetEmail(link);
    const { error } = await resendClient().emails.send({ from: emailFrom(), to: user.email, subject, html, text });
    if (error) {
      await throttleRef.delete();
      console.error("Admin password reset email failed", error);
    }
  } catch (error) {
    console.error("Admin password reset failed", error);
  }
  return { ok: true };
}
