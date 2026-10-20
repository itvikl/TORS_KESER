import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import { emailFrom, resendClient } from "@/lib/email/resend";
import { adminSignInCodeEmail } from "@/lib/email/templates/adminSignInCode";

/**
 * Emailed one-time codes — the admin second factor for accounts without an
 * authenticator app. One pending code per account, stored hashed in
 * adminSignInCodes/{uid} (Admin SDK only; Firestore rules deny clients) and
 * tied to the sign-in it was issued for.
 */
const COLLECTION = "adminSignInCodes";
export const EMAIL_CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
/** Asking again sooner than this reuses the pending code instead of sending another. */
const RESEND_AFTER_MS = 60 * 1000;

interface PendingCode {
  codeHash: string;
  authTime: number;
  sentAt: number;
  expiresAt: number;
  attempts: number;
}

function hashCode(uid: string, authTime: number, code: string): string {
  return createHmac("sha256", process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "")
    .update(`${uid}:${authTime}:${code}`)
    .digest("hex");
}

/** "zsondhelm@gmail.com" → "zs•••@gmail.com", for "we sent a code to …". */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}•••@${domain}`;
}

/** Emails a fresh code for this sign-in (unless one went out under a minute ago). Throws if it can't send. */
export async function sendAdminEmailCode(uid: string, email: string, authTime: number): Promise<void> {
  const ref = adminDb().collection(COLLECTION).doc(uid);
  const existing = (await ref.get()).data() as PendingCode | undefined;
  if (existing && existing.authTime === authTime && Date.now() - existing.sentAt < RESEND_AFTER_MS) {
    return;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = Date.now();
  const pending: PendingCode = {
    codeHash: hashCode(uid, authTime, code),
    authTime,
    sentAt: now,
    expiresAt: now + EMAIL_CODE_MINUTES * 60 * 1000,
    attempts: 0,
  };
  await ref.set(pending);

  const { subject, html, text } = adminSignInCodeEmail(code, EMAIL_CODE_MINUTES);
  const { error } = await resendClient().emails.send({ from: emailFrom(), to: email, subject, html, text });
  if (error) {
    await ref.delete();
    throw new Error(`Couldn't send sign-in code: ${error.message}`);
  }
}

/** True once per valid code; wrong guesses count toward MAX_ATTEMPTS, after which a new code is needed. */
export async function verifyAdminEmailCode(uid: string, authTime: number, code: string): Promise<boolean> {
  const ref = adminDb().collection(COLLECTION).doc(uid);
  return adminDb().runTransaction(async (tx) => {
    const pending = (await tx.get(ref)).data() as PendingCode | undefined;
    if (!pending || pending.authTime !== authTime || pending.expiresAt < Date.now()) return false;
    if (pending.attempts >= MAX_ATTEMPTS) {
      tx.delete(ref);
      return false;
    }

    const expected = Buffer.from(pending.codeHash, "hex");
    const actual = Buffer.from(hashCode(uid, authTime, code.trim()), "hex");
    if (!timingSafeEqual(expected, actual)) {
      tx.update(ref, { attempts: pending.attempts + 1 });
      return false;
    }
    tx.delete(ref);
    return true;
  });
}
