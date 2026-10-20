import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { createSessionCookie, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/constants";
import { MFA_ENROLLMENT_REQUIRED, passesAdmin2fa } from "@/lib/auth/mfa";

/** Firebase's guidance: only mint a session cookie from a sign-in that just happened. */
const MAX_SIGN_IN_AGE_SECONDS = 5 * 60;

/** Exchanges a fresh Firebase ID token (from the client SDK sign-in) for an httpOnly session cookie. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const idToken = body?.idToken;

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
  // Signed in with password only, but 2FA is required: the client keeps the
  // Firebase user signed in and walks them through enrolling an authenticator.
  if (!passesAdmin2fa(decoded)) {
    return NextResponse.json({ error: MFA_ENROLLMENT_REQUIRED }, { status: 403 });
  }

  const sessionCookie = await createSessionCookie(idToken);
  await setSessionCookie(sessionCookie);
  return NextResponse.json({ ok: true });
}

/** Logout: clears the session cookie. */
export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
