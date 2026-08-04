/**
 * Shared between proxy.ts (Node.js runtime, reads request.cookies directly)
 * and lib/auth/session.ts (Server Components/Route Handlers, uses
 * next/headers). Kept dependency-free so both can import it.
 */
export const SESSION_COOKIE_NAME = "session";

// Firebase session cookies support a maximum lifetime of 14 days.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export const ADMIN_ROLES = ["staff", "admin"] as const;
