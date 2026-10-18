/**
 * Input sanitizers + matching patterns for registration fields. The forms run
 * the sanitizer on every keystroke/paste (so disallowed characters never
 * appear), and booking.ts re-checks the same patterns on the server.
 */

export const PASSPORT_MAX_LENGTH = 10;
export const NAME_MAX_LENGTH = 50;
export const PHONE_MAX_LENGTH = 20;

export const PASSPORT_PATTERN = /^[A-Z0-9]{1,10}$/;
export const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u;
export const PHONE_PATTERN = /^\+?[\d\s()-]{5,20}$/;

/** Latin letters (uppercased) and digits, at most 10 — many countries' passport numbers mix both. */
export function sanitizePassport(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, PASSPORT_MAX_LENGTH);
}

/** Letters (any language), spaces, apostrophe, hyphen, dot — no digits or other symbols. */
export function sanitizeName(value: string): string {
  return value.replace(/[^\p{L}\p{M}\s'’.-]/gu, "").slice(0, NAME_MAX_LENGTH);
}

/** Digits, spaces, hyphens, parentheses, and a single leading "+". */
export function sanitizePhone(value: string): string {
  const hasPlus = value.trimStart().startsWith("+");
  const body = value.replace(/[^\d\s()-]/g, "");
  return ((hasPlus ? "+" : "") + body).slice(0, PHONE_MAX_LENGTH);
}
