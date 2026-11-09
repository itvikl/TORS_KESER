/**
 * Blog publish dates are stored as ISO strings. Dates picked in the admin
 * are saved at 12:00 UTC and always shown in UTC, so the day staff choose
 * is the day every visitor sees, whatever their time zone.
 */

export function formatBlogDate(iso: string | undefined, month: "long" | "short" = "long"): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month, day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** ISO → "YYYY-MM-DD" for an <input type="date">. */
export function toDateInputValue(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" from an <input type="date"> → stored ISO, or undefined when cleared. */
export function fromDateInputValue(value: string): string | undefined {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : undefined;
}
