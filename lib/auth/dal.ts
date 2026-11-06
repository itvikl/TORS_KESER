import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import {
  canDelete,
  canDeleteContent,
  canManageAccounts,
  isAdminRole,
  SEO_ADMIN_HOME,
  type AdminRole,
  type SeoDeletableKind,
} from "@/lib/auth/roles";
import { EMAIL_MFA_COOKIE_NAME, passesAdmin2fa } from "@/lib/auth/secondFactor";

/**
 * Data Access Layer for the admin session (PRD section 9: role-based
 * access via Firebase custom claims). proxy.ts already redirects
 * unauthenticated requests before they reach a page, but per the Next.js
 * auth guide that's an optimistic first line of defense, not the only one —
 * every admin page and Server Action re-verifies here, close to the data.
 */
export interface AdminSession {
  uid: string;
  email: string | null;
  role: AdminRole;
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(cookieValue, true);
    const role: unknown = decoded.role;
    if (!isAdminRole(role)) return null;
    if (!passesAdmin2fa(decoded, cookieStore.get(EMAIL_MFA_COOKIE_NAME)?.value)) return null;
    return { uid: decoded.uid, email: decoded.email ?? null, role };
  } catch {
    return null;
  }
});

/**
 * Any admin role, SEO admins included. Only for the content/SEO sections
 * (Site Content, Blog, SEO Landing Pages, Image Library, My account) and the
 * shared admin layout — see SEO_ADMIN_PATHS in lib/auth/roles.ts.
 */
export async function requireContentSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * Every admin role except SEO admin — the default gate for admin pages and
 * Server Actions. Anything not explicitly opened with requireContentSession()
 * stays closed to SEO admins.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await requireContentSession();
  if (session.role === "seo_admin") redirect(SEO_ADMIN_HOME);
  return session;
}

/** Deleting content (tours, blog posts, leads…): developer, super admin and admin. */
export async function requireAdminRole(): Promise<AdminSession> {
  const session = await requireContentSession();
  if (!canDeleteContent(session.role)) redirect("/admin");
  return session;
}

/** Deleting a blog post or SEO page: as above, plus SEO admins. */
export async function requireDeleteRight(kind: SeoDeletableKind): Promise<AdminSession> {
  const session = await requireContentSession();
  if (!canDelete(session.role, kind)) redirect("/admin");
  return session;
}

/** Seeing and managing admin accounts: developer and super admin only. */
export async function requireAccountManager(): Promise<AdminSession> {
  const session = await requireContentSession();
  if (!canManageAccounts(session.role)) redirect("/admin");
  return session;
}
