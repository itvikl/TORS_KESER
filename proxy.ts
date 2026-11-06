import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { canAccessAdminPath, isAdminRole, SEO_ADMIN_HOME } from "@/lib/auth/roles";
import { EMAIL_MFA_COOKIE_NAME, passesAdmin2fa } from "@/lib/auth/secondFactor";
import { getArchivedTourRedirectPath, getTourBySlug } from "@/lib/data/tours";

/**
 * Archived tours (no upcoming dates) keep their old URL alive by redirecting
 * to the closest live tour. Decided here, per request, from the tour's current
 * status — archived tours come back when new dates are added, so this can't
 * be a static map in next.config (that is how a stale rule once sent the live
 * Galápagos and India tours to the home page).
 *
 * It has to happen in proxy rather than in the page: the marketing pages sit
 * under a loading.tsx, so a redirect() inside the page streams out as a
 * 200 + meta-refresh instead of a real HTTP redirect. Temporary (307) on
 * purpose, so browsers don't cache it and keep redirecting after the tour is
 * published again.
 */
async function redirectArchivedTour(request: NextRequest) {
  try {
    const slug = decodeURIComponent(request.nextUrl.pathname.slice("/tours/".length));
    const tour = await getTourBySlug(slug);
    // No such tour (or an unpublished draft): answer with a real 404. The page's
    // own notFound() streams out under loading.tsx as 200 — a soft 404 for Google.
    // Rewriting to a path no route matches renders the site's 404 page, status 404,
    // while the address bar keeps the visitor's URL.
    if (!tour) return NextResponse.rewrite(new URL("/__tour-not-found", request.url));
    if (tour.status === "archived") {
      return NextResponse.redirect(new URL(await getArchivedTourRedirectPath(tour), request.url));
    }
  } catch (err) {
    // A failed lookup must never take a tour page down — let it render.
    console.error("Archived-tour redirect lookup failed:", err);
  }
  return NextResponse.next();
}

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
  if (request.nextUrl.pathname.startsWith("/tours/")) {
    return redirectArchivedTour(request);
  }

  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const decoded = await adminAuth().verifySessionCookie(sessionCookie);
    if (!isAdminRole(decoded.role) || !passesAdmin2fa(decoded, request.cookies.get(EMAIL_MFA_COOKIE_NAME)?.value)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // Role-based page access (lib/auth/roles.ts): SEO admins only reach the
    // content/SEO sections; Admin accounts is for developers/super admins.
    if (!canAccessAdminPath(decoded.role, request.nextUrl.pathname)) {
      const home = decoded.role === "seo_admin" ? SEO_ADMIN_HOME : "/admin";
      return NextResponse.redirect(new URL(home, request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // "/tours/:slug" is one segment only — the /book pages are not redirected.
  matcher: ["/admin/:path*", "/tours/:slug"],
};
