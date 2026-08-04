import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { createSessionCookie, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";

/** Exchanges a fresh Firebase ID token (from the client SDK sign-in) for an httpOnly session cookie. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const idToken = body?.idToken;

  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    await adminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
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
