import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, ADMIN_ROLES } from "@/lib/auth/constants";

/**
 * Gate for /admin/* (PRD section 9). This project targets Next.js 16,
 * where the old `middleware.ts` convention was renamed to `proxy.ts`
 * (see node_modules/next/dist/docs/.../file-conventions/proxy.md) — do not
 * reintroduce a middleware.ts file.
 *
 * Proxy defaults to the Node.js runtime in this Next.js version (unlike the
 * old Edge-only Middleware), so it can call firebase-admin directly and
 * fully verify the session cookie's signature here rather than doing only
 * an optimistic "cookie exists" check. Server Actions and pages still
 * re-verify via lib/auth/dal.ts — this is defense in depth, not the only
 * check (see the Next.js auth guide's warning against relying on proxy alone).
 */
export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const decoded = await adminAuth().verifySessionCookie(sessionCookie);
    if (!ADMIN_ROLES.includes(decoded.role)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
