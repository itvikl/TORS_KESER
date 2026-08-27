"use client";

import { useEffect, useState } from "react";
import { useTourFilter } from "@/components/marketing/TourFilterProvider";
import TourCard from "@/components/marketing/TourCard";

const INITIAL_VISIBLE = 12;

export default function FeaturedToursGrid() {
  const { selectedCountries, dateFrom, dateTo, filteredTours: tours } = useTourFilter();
  const [expanded, setExpanded] = useState(false);
  const hasDateFilter = Boolean(dateFrom || dateTo);
  const isFiltered = selectedCountries.length > 0 || hasDateFilter;

  useEffect(() => {
    setExpanded(false);
  }, [selectedCountries, dateFrom, dateTo]);

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
          {hasDateFilter
            ? "No tours depart in that date range right now"
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
