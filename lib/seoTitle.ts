/**
 * The root layout appends " | Keshertours" to every page title. Titles saved
 * with the brand already in them (the migrated tours, or an admin who types it
 * out) would show it twice, so the trailing brand is dropped before the layout
 * adds it back.
 */
export function withoutBrandSuffix(title: string): string {
  return title.replace(/\s*[|–—-]\s*Keshertours\s*$/i, "").trim() || title;
}
