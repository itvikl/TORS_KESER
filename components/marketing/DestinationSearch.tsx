"use client";

import { useEffect, useState } from "react";
import CountrySelect from "@/components/marketing/CountrySelect";
import { useTourFilter } from "@/components/marketing/TourFilterProvider";

/**
 * Client-side destination search — filters in-memory tours (multi-country +
 * departure date range) and updates the URL query for deep links / SEO
 * without a full reload.
 */
export default function DestinationSearch() {
  const { selectedCountries, dateFrom, dateTo, applyFilters, countries } =
    useTourFilter();
  const [draftCountries, setDraftCountries] = useState(selectedCountries);
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);

  useEffect(() => {
    setDraftCountries(selectedCountries);
  }, [selectedCountries]);

  useEffect(() => {
    setDraftFrom(dateFrom);
  }, [dateFrom]);

  useEffect(() => {
    setDraftTo(dateTo);
  }, [dateTo]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters({
          countries: draftCountries,
          dateFrom: draftFrom,
          dateTo: draftTo,
        });
      }}
      className="destination-search glass-card relative mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl p-2 shadow-2xl backdrop-blur-lg sm:flex-row sm:items-stretch sm:rounded-full"
    >
      <div className="flex flex-1 items-center gap-3 rounded-full px-5 py-3 transition-colors hover:bg-[var(--color-surface-hover-a)]">
        <CountrySelect countries={countries} value={draftCountries} onChange={setDraftCountries} />
      </div>

      <div className="flex flex-1 items-center gap-3 rounded-full px-5 py-3 transition-colors hover:bg-[var(--color-surface-hover-a)] sm:border-l sm:border-[var(--color-border-hairline)]">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="destination-search-from"
            className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-slate)]"
          >
            From
          </label>
          <input
            id="destination-search-from"
            type="date"
            value={draftFrom}
            max={draftTo || undefined}
            onChange={(event) => setDraftFrom(event.target.value)}
            style={{ colorScheme: "var(--color-scheme)" }}
            className="mt-0.5 w-full min-w-0 bg-transparent p-0 text-[15px] font-medium text-[var(--color-mist)] outline-none focus-visible:outline-none"
          />
        </div>
        <div className="min-w-0 flex-1">
          <label
            htmlFor="destination-search-to"
            className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-slate)]"
          >
            To
          </label>
          <input
            id="destination-search-to"
            type="date"
            value={draftTo}
            min={draftFrom || undefined}
            onChange={(event) => setDraftTo(event.target.value)}
            style={{ colorScheme: "var(--color-scheme)" }}
            className="mt-0.5 w-full min-w-0 bg-transparent p-0 text-[15px] font-medium text-[var(--color-mist)] outline-none focus-visible:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        className="rounded-full bg-[var(--color-ice)] px-10 py-3.5 text-[15px] font-bold text-[var(--color-ice-ink)] shadow-lg transition-all hover:brightness-110 active:scale-95 sm:px-12"
      >
        Search Tours
      </button>
    </form>
  );
}
