import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, ADMIN_ROLES } from "@/lib/auth/constants";
import type { UserRole } from "@/lib/types";

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
  role: UserRole;
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const cookieValue = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(cookieValue, true);
    const role = (decoded.role as UserRole | undefined) ?? "customer";
    if (!ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) return null;
    return { uid: decoded.uid, email: decoded.email ?? null, role };
  } catch {
    return null;
  }
});

/** Use in admin pages/layouts. Redirects to login when unauthorized. */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
