"use client";

import { useEffect, useState } from "react";
import RegionSelect from "@/components/marketing/RegionSelect";
import { useTourFilter } from "@/components/marketing/TourFilterProvider";

/**
 * Client-side destination search — filters in-memory tours (multi-region)
 * and updates the URL query for deep links / SEO without a full reload.
 */
export default function DestinationSearch() {
  const { selectedRegions, setSelectedRegions, regions } = useTourFilter();
  const [draft, setDraft] = useState(selectedRegions);

  useEffect(() => {
    setDraft(selectedRegions);
  }, [selectedRegions]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSelectedRegions(draft);
      }}
      className="destination-search relative mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] p-2 shadow-2xl backdrop-blur-lg sm:flex-row sm:items-stretch sm:rounded-full"
    >
      <div className="flex flex-1 items-center gap-3 rounded-full px-5 py-3 transition-colors hover:bg-white/5">
        <RegionSelect regions={regions} value={draft} onChange={setDraft} />
      </div>
      <button
        type="submit"
        className="rounded-full bg-[#7dd3fc] px-10 py-3.5 text-[15px] font-bold text-[#001f2e] shadow-lg transition-all hover:brightness-110 active:scale-95 sm:px-12"
      >
        Search Tours
      </button>
    </form>
  );
}
