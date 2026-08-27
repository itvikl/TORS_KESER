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
import { smoothScrollTo } from "@/lib/smoothScroll";

/** Id of the DestinationSearch root, so results and "Change Search" can scroll to each other. */
export const SEARCH_ANCHOR_ID = "destination-search";
/** Id of the Featured Tours heading, so applying a filter can scroll down to it. */
export const RESULTS_ANCHOR_ID = "featured-tours";

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
  selectedMonths: string[];
  applyFilters: (
    next: { countries: string[]; months: string[] },
    opts?: { scroll?: boolean }
  ) => void;
  scrollToResults: () => void;
  scrollToSearch: () => void;
  countries: CountryOption[];
  tours: FeaturedTourItem[];
  filteredTours: FilteredTourItem[];
};

const TourFilterContext = createContext<TourFilterContextValue | null>(null);

function parseListParam(
  searchParams: URLSearchParams,
  key: string,
  fallback: string[] = []
): string[] {
  const fromUrl = searchParams.getAll(key).filter(Boolean);
  return fromUrl.length > 0 ? fromUrl : fallback;
}

/** "YYYY-MM" for a departure's start date, using UTC to match date-only ISO strings. */
function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** A tour "matches" a set of months if it has a planned departure starting in one of them. */
function matchingDeparture(
  departures: Departure[],
  months: string[]
): Departure | undefined {
  const wanted = new Set(months);

  return departures.find((departure) => {
    if (!isDeparturePlanned(departure)) return false;
    return wanted.size === 0 || wanted.has(monthKey(departure.startDate));
  });
}

export function TourFilterProvider({
  countries,
  tours,
  initialCountries = [],
  initialMonths = [],
  children,
}: {
  countries: CountryOption[];
  tours: FeaturedTourItem[];
  initialCountries?: string[];
  initialMonths?: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedCountries, setSelectedCountries] = useState(initialCountries);
  const [selectedMonths, setSelectedMonths] = useState(initialMonths);

  useEffect(() => {
    setSelectedCountries(parseListParam(searchParams, "country"));
    setSelectedMonths(parseListParam(searchParams, "month"));
  }, [searchParams]);

  // Leave room for the sticky header (and a bit of breathing room) instead
  // of flushing the target flat to the very top of the viewport.
  const headerOffset = 140;

  const scrollToResults = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById(RESULTS_ANCHOR_ID);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      smoothScrollTo(top);
    });
  }, []);

  const scrollToSearch = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById(SEARCH_ANCHOR_ID);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      smoothScrollTo(top);
    });
  }, []);

  const applyFilters = useCallback(
    (
      next: { countries: string[]; months: string[] },
      opts?: { scroll?: boolean }
    ) => {
      const nextCountries = [...new Set(next.countries.filter(Boolean))];
      const nextMonths = [...new Set(next.months.filter(Boolean))];
      setSelectedCountries(nextCountries);
      setSelectedMonths(nextMonths);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("country");
      for (const country of nextCountries) {
        params.append("country", country);
      }
      params.delete("month");
      for (const month of nextMonths) {
        params.append("month", month);
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

      if (opts?.scroll !== false) {
        scrollToResults();
      }
    },
    [pathname, router, searchParams, scrollToResults]
  );

  const filteredTours = useMemo(() => {
    const selected = new Set(selectedCountries);
    const hasMonthFilter = selectedMonths.length > 0;

    const inCountry = tours.filter(
      (item) =>
        selected.size === 0 || item.tour.countries.some((c) => selected.has(c))
    );

    if (!hasMonthFilter) {
      return inCountry.map(({ tour, departures, image }) => ({
        tour,
        nextDeparture: departures[0],
        image,
      }));
    }

    const matched: FilteredTourItem[] = [];
    for (const { tour, departures, image } of inCountry) {
      const departure = matchingDeparture(departures, selectedMonths);
      if (departure) matched.push({ tour, nextDeparture: departure, image });
    }
    return matched;
  }, [selectedCountries, selectedMonths, tours]);

  const value = useMemo(
    () => ({
      selectedCountries,
      selectedMonths,
      applyFilters,
      scrollToResults,
      scrollToSearch,
      countries,
      tours,
      filteredTours,
    }),
    [
      selectedCountries,
      selectedMonths,
      applyFilters,
      scrollToResults,
      scrollToSearch,
      countries,
      tours,
      filteredTours,
    ]
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
