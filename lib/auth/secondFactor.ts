import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { hasSecondFactor, isAdmin2faRequired } from "@/lib/auth/mfa";

/**
 * Server-side "did this session pass a second factor?" check, shared by
 * proxy.ts, lib/auth/dal.ts and app/api/auth/session.
 *
 * Two ways to pass: an authenticator app (Firebase stamps
 * `firebase.sign_in_second_factor` into the session cookie), or an emailed
 * code (lib/auth/emailMfa.ts) — which Firebase knows nothing about, so it's
 * recorded in a separate HMAC-signed cookie bound to the session's uid and
 * sign-in time. A new sign-in has a new auth_time, so an old proof can't be
 * replayed onto it.
 */
export const EMAIL_MFA_COOKIE_NAME = "admin_email_mfa";

/** Derived from the Admin SDK key (already a secret) so no extra secret needs managing. */
function signingKey(): Buffer {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!privateKey) throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is not set.");
  return createHash("sha256").update(`admin-email-mfa\0${privateKey}`).digest();
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function createEmailMfaToken(uid: string, authTime: number, maxAgeSeconds: number): string {
  const payload = `${uid}.${authTime}.${Math.floor(Date.now() / 1000) + maxAgeSeconds}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyEmailMfaToken(token: string | undefined, uid: string, authTime: number): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [tokenUid, tokenAuthTime, expires, signature] = parts;
  if (tokenUid !== uid || Number(tokenAuthTime) !== authTime) return false;
  if (Number(expires) < Date.now() / 1000) return false;

  const expected = Buffer.from(sign(`${tokenUid}.${tokenAuthTime}.${expires}`));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

type DecodedSession = { uid: string; auth_time: number; firebase?: { sign_in_second_factor?: string } };

export function passesAdmin2fa(decoded: DecodedSession, emailMfaToken: string | undefined): boolean {
  return (
    !isAdmin2faRequired() ||
    hasSecondFactor(decoded) ||
    verifyEmailMfaToken(emailMfaToken, decoded.uid, decoded.auth_time)
  );
}
