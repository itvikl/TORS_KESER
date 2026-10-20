import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import {
  clearSessionCookie,
  createSessionCookie,
  setEmailMfaCookie,
  setSessionCookie,
} from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/constants";
import {
  EMAIL_CODE_INVALID,
  EMAIL_CODE_SENT,
  EMAIL_CODE_UNDELIVERABLE,
  hasSecondFactor,
  isAdmin2faRequired,
} from "@/lib/auth/mfa";
import { maskEmail, sendAdminEmailCode, verifyAdminEmailCode } from "@/lib/auth/emailMfa";

/**
 * Firebase's guidance is to mint session cookies only from a fresh sign-in;
 * the window matches the emailed code's lifetime so reading the email fits.
 */
const MAX_SIGN_IN_AGE_SECONDS = 10 * 60;

/**
 * Exchanges a fresh Firebase ID token (from the client SDK sign-in) for an
 * httpOnly session cookie. When 2FA is required and the sign-in didn't use an
 * authenticator app, the first call emails a code (EMAIL_CODE_SENT) and the
 * client calls again with `emailCode`.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const idToken = body?.idToken;
  const emailCode = typeof body?.emailCode === "string" ? body.emailCode : undefined;

  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken, true);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  if (Date.now() / 1000 - decoded.auth_time > MAX_SIGN_IN_AGE_SECONDS) {
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  }
  if (!ADMIN_ROLES.includes(decoded.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const needsEmailCode = isAdmin2faRequired() && !hasSecondFactor(decoded);
  if (needsEmailCode) {
    if (!decoded.email) {
      return NextResponse.json({ error: EMAIL_CODE_UNDELIVERABLE }, { status: 502 });
    }
    if (!emailCode) {
      try {
        await sendAdminEmailCode(decoded.uid, decoded.email, decoded.auth_time);
      } catch (error) {
        console.error("Admin sign-in code email failed", error);
        return NextResponse.json({ error: EMAIL_CODE_UNDELIVERABLE }, { status: 502 });
      }
      return NextResponse.json({ error: EMAIL_CODE_SENT, sentTo: maskEmail(decoded.email) }, { status: 403 });
    }
    if (!(await verifyAdminEmailCode(decoded.uid, decoded.auth_time, emailCode))) {
      return NextResponse.json({ error: EMAIL_CODE_INVALID }, { status: 401 });
    }
  }

  const sessionCookie = await createSessionCookie(idToken);
  await setSessionCookie(sessionCookie);
  if (needsEmailCode) await setEmailMfaCookie(decoded.uid, decoded.auth_time);
  return NextResponse.json({ ok: true });
}

/** Logout: clears the session cookie (and any email-2FA proof). */
export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
