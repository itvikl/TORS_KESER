import type { Tour } from "@/lib/types";

/**
 * Shared display-order comparator for the admin tours list and the public
 * homepage grid, so the admin's manual ordering is reflected identically on
 * both. Tours without a sortOrder yet (pre-migration) fall back to
 * alphabetical, sorting after any tour that does have one.
 */
export function bySortOrder(a: Tour, b: Tour): number {
  const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
  return orderA !== orderB ? orderA - orderB : a.title.localeCompare(b.title);
}
