/** Fallback when no number is saved in Admin → Settings (and for the admin tour preview, which renders outside the site layout). */
export const DEFAULT_SITE_PHONE = "1-800-847-0700";

/** "1-800-847-0700" → "tel:18008470700". */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
