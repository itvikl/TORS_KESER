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
import type { RegionOption } from "@/lib/data/tours";

export type FeaturedTourItem = {
  tour: Tour;
  nextDeparture?: Departure;
  image: string;
};

type TourFilterContextValue = {
  selectedRegions: string[];
  setSelectedRegions: (regions: string[], opts?: { scroll?: boolean }) => void;
  regions: RegionOption[];
  tours: FeaturedTourItem[];
  filteredTours: FeaturedTourItem[];
};

const TourFilterContext = createContext<TourFilterContextValue | null>(null);

function parseRegionsParam(
  searchParams: URLSearchParams,
  fallback: string[] = []
): string[] {
  const fromUrl = searchParams.getAll("region").filter(Boolean);
  return fromUrl.length > 0 ? fromUrl : fallback;
}

export function TourFilterProvider({
  regions,
  tours,
  initialRegions = [],
  children,
}: {
  regions: RegionOption[];
  tours: FeaturedTourItem[];
  initialRegions?: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedRegions, setSelectedRegionsState] = useState(initialRegions);

  useEffect(() => {
    setSelectedRegionsState(parseRegionsParam(searchParams));
  }, [searchParams]);

  const setSelectedRegions = useCallback(
    (next: string[], opts?: { scroll?: boolean }) => {
      const unique = [...new Set(next.filter(Boolean))];
      setSelectedRegionsState(unique);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("region");
      for (const region of unique) {
        params.append("region", region);
      }

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
    if (selectedRegions.length === 0) return tours;
    const selected = new Set(selectedRegions);
    return tours.filter((item) => selected.has(item.tour.region));
  }, [selectedRegions, tours]);

  const value = useMemo(
    () => ({
      selectedRegions,
      setSelectedRegions,
      regions,
      tours,
      filteredTours,
    }),
    [selectedRegions, setSelectedRegions, regions, tours, filteredTours]
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
