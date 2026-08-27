"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Departure, Tour } from "@/lib/types";
import type { CountryOption } from "@/lib/data/tours";
import { isDeparturePlanned } from "@/lib/departureAvailability";

export type FeaturedTourItem = {
  tour: Tour;
  departures: Departure[];
  image: string;
};

export type FilteredTourItem = {
  tour: Tour;
  nextDeparture?: Departure;
  image: string;
};

type TourFilterContextValue = {
  selectedCountries: string[];
  dateFrom: string;
  dateTo: string;
  applyFilters: (
    next: { countries: string[]; dateFrom: string; dateTo: string },
    opts?: { scroll?: boolean }
  ) => void;
  countries: CountryOption[];
  tours: FeaturedTourItem[];
  filteredTours: FilteredTourItem[];
};

const TourFilterContext = createContext<TourFilterContextValue | null>(null);

function parseCountriesParam(
  searchParams: URLSearchParams,
  fallback: string[] = []
): string[] {
  const fromUrl = searchParams.getAll("country").filter(Boolean);
  return fromUrl.length > 0 ? fromUrl : fallback;
}

/** A tour "matches" a date range if it has a planned departure starting in it. */
function matchingDeparture(
  departures: Departure[],
  dateFrom: string,
  dateTo: string
): Departure | undefined {
  const fromTime = dateFrom ? new Date(dateFrom).getTime() : undefined;
  const toTime = dateTo ? new Date(dateTo).getTime() : undefined;

  return departures.find((departure) => {
    if (!isDeparturePlanned(departure)) return false;
    const start = new Date(departure.startDate).getTime();
    if (fromTime !== undefined && start < fromTime) return false;
    if (toTime !== undefined && start > toTime) return false;
    return true;
  });
}

export function TourFilterProvider({
  countries,
  tours,
  initialCountries = [],
  initialDateFrom = "",
  initialDateTo = "",
  children,
}: {
  countries: CountryOption[];
  tours: FeaturedTourItem[];
  initialCountries?: string[];
  initialDateFrom?: string;
  initialDateTo?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedCountries, setSelectedCountries] = useState(initialCountries);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

  useEffect(() => {
    setSelectedCountries(parseCountriesParam(searchParams));
    setDateFrom(searchParams.get("from") ?? "");
    setDateTo(searchParams.get("to") ?? "");
  }, [searchParams]);

  const applyFilters = useCallback(
    (
      next: { countries: string[]; dateFrom: string; dateTo: string },
      opts?: { scroll?: boolean }
    ) => {
      const nextCountries = [...new Set(next.countries.filter(Boolean))];
      setSelectedCountries(nextCountries);
      setDateFrom(next.dateFrom);
      setDateTo(next.dateTo);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("country");
      for (const country of nextCountries) {
        params.append("country", country);
      }
      if (next.dateFrom) params.set("from", next.dateFrom);
      else params.delete("from");
      if (next.dateTo) params.set("to", next.dateTo);
      else params.delete("to");

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

      if (opts?.scroll !== false) {
        requestAnimationFrame(() => {
          document
            .getElementById("featured-tours")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    },
    [pathname, router, searchParams]
  );

  const filteredTours = useMemo(() => {
    const selected = new Set(selectedCountries);
    const hasDateFilter = Boolean(dateFrom || dateTo);

    const inCountry = tours.filter(
      (item) =>
        selected.size === 0 || item.tour.countries.some((c) => selected.has(c))
    );

    if (!hasDateFilter) {
      return inCountry.map(({ tour, departures, image }) => ({
        tour,
        nextDeparture: departures[0],
        image,
      }));
    }

    const matched: FilteredTourItem[] = [];
    for (const { tour, departures, image } of inCountry) {
      const departure = matchingDeparture(departures, dateFrom, dateTo);
      if (departure) matched.push({ tour, nextDeparture: departure, image });
    }
    return matched;
  }, [selectedCountries, dateFrom, dateTo, tours]);

  const value = useMemo(
    () => ({
      selectedCountries,
      dateFrom,
      dateTo,
      applyFilters,
      countries,
      tours,
      filteredTours,
    }),
    [selectedCountries, dateFrom, dateTo, applyFilters, countries, tours, filteredTours]
  );

  return (
    <TourFilterContext.Provider value={value}>
      {children}
    </TourFilterContext.Provider>
  );
}

export function useTourFilter() {
  const ctx = useContext(TourFilterContext);
  if (!ctx) {
    throw new Error("useTourFilter must be used within TourFilterProvider");
  }
  return ctx;
}
