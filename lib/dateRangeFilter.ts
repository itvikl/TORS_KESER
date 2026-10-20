/** Inclusive YYYY-MM-DD bounds; either side may be omitted. */
export interface DateRangeFilter {
  from?: string;
  to?: string;
}

/** Accepts only well-formed YYYY-MM-DD strings (e.g. straight from searchParams). */
export function parseDateRangeFilter(params: {
  from?: string | string[] | null;
  to?: string | string[] | null;
}): DateRangeFilter {
  const valid = (value?: string | string[] | null) =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
  return { from: valid(params.from), to: valid(params.to) };
}

/** ISO strings' first 10 chars compare lexically as a date. */
export function isInDateRange(iso: string, filter: DateRangeFilter): boolean {
  const day = iso.slice(0, 10);
  return (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to);
}

export function isDateRangeActive(filter: DateRangeFilter): boolean {
  return Boolean(filter.from || filter.to);
}

/** `?from=&to=` query string (with leading "?"), or "" when unfiltered. */
export function dateRangeQuery(filter: DateRangeFilter): string {
  const params = new URLSearchParams();
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  return params.size ? `?${params}` : "";
}
