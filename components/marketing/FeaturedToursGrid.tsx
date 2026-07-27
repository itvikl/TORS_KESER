"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTourFilter } from "@/components/marketing/TourFilterProvider";

const INITIAL_VISIBLE = 12;

export default function FeaturedToursGrid() {
  const { selectedRegions, filteredTours: tours } = useTourFilter();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [selectedRegions]);

  const visible = expanded ? tours : tours.slice(0, INITIAL_VISIBLE);
  const canExpand = tours.length > INITIAL_VISIBLE;

  const heading =
    selectedRegions.length === 0
      ? "Featured Tours"
      : selectedRegions.length === 1
        ? `Tours to ${selectedRegions[0]}`
        : selectedRegions.length === 2
          ? `Tours to ${selectedRegions[0]} & ${selectedRegions[1]}`
          : `Tours to ${selectedRegions.length} regions`;

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#7dd3fc]">
            Curated Selections
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            {heading}
          </h2>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <p className="max-w-md text-[15px] leading-7 text-[#a0b4c4] md:text-right">
            {selectedRegions.length > 0
              ? `${tours.length} kosher tour${tours.length === 1 ? "" : "s"} matching your search.`
              : "Hand-selected journeys that balance comfort, kashrut, and discovery — shaped around your family and your travel style."}
          </p>
          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-sm font-bold text-[#7dd3fc] transition hover:brightness-110"
            >
              {expanded ? "Show less" : `Show more (${tours.length - INITIAL_VISIBLE})`}
            </button>
          )}
        </div>
      </div>

      {tours.length === 0 ? (
        <p className="mt-12 text-[#a0b4c4]">
          No tours match that region right now — call us at{" "}
          <a href="tel:18008470700" className="font-semibold text-[#7dd3fc]">
            1-800-847-0700
          </a>
          .
        </p>
      ) : (
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {visible.map(({ tour, nextDeparture, image }) => (
            <article
              key={tour.tourId}
              className="group flex flex-col overflow-hidden rounded-3xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] shadow-2xl backdrop-blur-lg transition-all duration-500 hover:border-[rgba(125,211,252,0.2)] hover:bg-[rgba(15,21,36,0.75)]"
            >
              <div className="relative h-72 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={tour.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute left-4 top-4 rounded-full border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#e0e8f0] backdrop-blur-lg">
                  {tour.region}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold text-[#e0e8f0]">{tour.title}</h3>
                  <span className="shrink-0 text-sm font-bold text-[#7dd3fc]">
                    From ${tour.pricing.pricePerPersonDouble.toLocaleString()}
                  </span>
                </div>

                <p className="mb-8 text-sm leading-relaxed text-[#a0b4c4]">
                  {tour.summary}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="text-xs font-semibold text-[#a0b4c4]">
                    {nextDeparture
                      ? `Departs ${new Date(nextDeparture.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}`
                      : "Flexible dates"}
                  </div>
                  <Link
                    href={`/tours/${tour.slug}`}
                    className="flex items-center gap-1 text-sm font-bold text-[#7dd3fc] transition-all group-hover:gap-2"
                  >
                    View Details <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
