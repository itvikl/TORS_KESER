"use client";

import { useEffect, useState } from "react";
import { useTourFilter } from "@/components/marketing/TourFilterProvider";
import TourCard from "@/components/marketing/TourCard";

const INITIAL_VISIBLE = 12;

function ChangeSearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

export default function FeaturedToursGrid() {
  const {
    selectedCountries,
    selectedMonths,
    filteredTours: tours,
    scrollToSearch,
  } = useTourFilter();
  const [expanded, setExpanded] = useState(false);
  const hasMonthFilter = selectedMonths.length > 0;
  const isFiltered = selectedCountries.length > 0 || hasMonthFilter;

  useEffect(() => {
    setExpanded(false);
  }, [selectedCountries, selectedMonths]);

  const visible = expanded ? tours : tours.slice(0, INITIAL_VISIBLE);
  const canExpand = tours.length > INITIAL_VISIBLE;

  const heading =
    selectedCountries.length === 0
      ? "Featured Tours"
      : selectedCountries.length === 1
        ? `Tours to ${selectedCountries[0]}`
        : selectedCountries.length === 2
          ? `Tours to ${selectedCountries[0]} & ${selectedCountries[1]}`
          : `Tours to ${selectedCountries.length} countries`;

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-ice)]">
            Curated Selections
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            {heading}
          </h2>
          {isFiltered && (
            <button
              type="button"
              onClick={scrollToSearch}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-hairline)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-slate)] transition-colors hover:border-[var(--color-border-ice-strong)] hover:text-[var(--color-ice)]"
            >
              <ChangeSearchIcon />
              Change Search
            </button>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <p className="max-w-md text-[15px] leading-7 text-[var(--color-slate)] md:text-right">
            {isFiltered
              ? `${tours.length} kosher tour${tours.length === 1 ? "" : "s"} matching your search.`
              : "Hand-selected journeys that balance comfort, kashrut, and discovery — shaped around your family and your travel style."}
          </p>
          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-sm font-bold text-[var(--color-ice)] transition hover:brightness-110"
            >
              {expanded ? "Show less" : `Show more (${tours.length - INITIAL_VISIBLE})`}
            </button>
          )}
        </div>
      </div>

      {tours.length === 0 ? (
        <p className="mt-12 text-[var(--color-slate)]">
          {hasMonthFilter
            ? "No tours depart in those months right now"
            : "No tours match that country right now"} — call us at{" "}
          <a href="tel:18008470700" className="font-semibold text-[var(--color-ice)]">
            1-800-847-0700
          </a>
          .
        </p>
      ) : (
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {visible.map(({ tour, nextDeparture, image }) => (
            <TourCard key={tour.tourId} tour={tour} nextDeparture={nextDeparture} image={image} />
          ))}
        </div>
      )}
    </div>
  );
}
