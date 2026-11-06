/**
 * Admin roles and what each may do — the single source of truth for
 * permissions. Dependency-free so proxy.ts, the server (lib/auth/dal.ts,
 * Server Actions) and client components can all import it.
 *
 *   developer    everything; outranks super admins (they can't change or delete a developer)
 *   super_admin  everything, including creating/deleting admin accounts
 *   admin        every section, and can delete content — but can't see or manage accounts
 *   staff        every section, can't delete content or see accounts
 *   seo_admin    only the content/SEO sections and tours (SEO_ADMIN_PATHS, not departure dates);
 *                can delete blog posts, SEO pages and tours that aren't live, but can't take a
 *                live tour offline; can't see accounts
 */
export const ADMIN_ROLES = ["developer", "super_admin", "admin", "staff", "seo_admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<AdminRole, string> = {
  developer: "Developer",
  super_admin: "Super admin",
  admin: "Admin",
  staff: "Staff",
  seo_admin: "SEO admin",
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  developer: "Full access, including admin accounts. Can't be changed by super admins.",
  super_admin: "Full access, including creating and deleting admin accounts.",
  admin: "All sections, can delete content. Can't see or manage accounts.",
  staff: "All sections, can't delete anything.",
  seo_admin:
    "Site Content, Blog, SEO Landing Pages, Image Library and Tours (not departure dates). Can delete blog posts, SEO pages and tours that aren't live.",
};

export function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && (ADMIN_ROLES as readonly string[]).includes(role);
}

export function roleLabel(role: unknown): string {
  return isAdminRole(role) ? ROLE_LABELS[role] : String(role ?? "—");
}

/** See, create, delete and change admin accounts (the Admin accounts page). */
export function canManageAccounts(role: unknown): boolean {
  return role === "developer" || role === "super_admin";
}

/** Delete anything — tours, blog posts, leads, reviews… (lib/actions/deletions.ts). */
export function canDeleteContent(role: unknown): boolean {
  return role === "developer" || role === "super_admin" || role === "admin";
}

/** What an SEO admin may delete (tours only when not live — see canDeleteTour). */
const SEO_ADMIN_DELETABLE = ["blogPost", "seoPage"] as const;
export type SeoDeletableKind = (typeof SEO_ADMIN_DELETABLE)[number];

export function canDelete(role: unknown, kind: SeoDeletableKind): boolean {
  return canDeleteContent(role) || (role === "seo_admin" && SEO_ADMIN_DELETABLE.includes(kind));
}

/** SEO admins can delete a tour only while it isn't live (draft or archived). */
export function canDeleteTour(role: unknown, status: unknown): boolean {
  return canDeleteContent(role) || (role === "seo_admin" && status !== "published");
}

/**
 * Unpublishing or archiving a live tour. Closed to SEO admins, or they could
 * archive a live tour and then delete it.
 */
export function canTakeTourOffline(role: unknown): boolean {
  return role !== "seo_admin";
}

/** The roles `actor` may hand out — only a developer can make another developer. */
export function assignableRoles(actor: unknown): AdminRole[] {
  if (actor === "developer") return [...ADMIN_ROLES];
  if (actor === "super_admin") return ADMIN_ROLES.filter((r) => r !== "developer");
  return [];
}

/** Whether `actor` may change or delete an account that currently has `target`'s role. */
export function canManageAccount(actor: unknown, target: unknown): boolean {
  if (!canManageAccounts(actor)) return false;
  return target !== "developer" || actor === "developer";
}

/** Where an SEO admin may go. Everything else under /admin is off limits. */
export const SEO_ADMIN_PATHS = [
  "/admin/site-content",
  "/admin/blog",
  "/admin/seo-pages",
  "/admin/media",
  "/admin/tours",
  "/admin/preview-frame",
  "/admin/account",
];

/** /admin/tours/{id}/departures… — dates, pricing, guides and bookings. */
const DEPARTURES_PATH = /^\/admin\/tours\/[^/]+\/departures(\/|$)/;
export const SEO_ADMIN_HOME = "/admin/site-content";

/** Page-level access, checked in proxy.ts and used to filter the sidebar. */
export function canAccessAdminPath(role: unknown, pathname: string): boolean {
  if (!isAdminRole(role)) return false;
  if (pathname.startsWith("/admin/staff/accounts")) return canManageAccounts(role);
  if (role === "seo_admin") {
    if (DEPARTURES_PATH.test(pathname)) return false;
    return SEO_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return true;
}
