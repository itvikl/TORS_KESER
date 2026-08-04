import Link from "next/link";
import type { Departure, Tour } from "@/lib/types";
import { formatUsd } from "@/lib/pricing";
import SafeImage from "@/components/ui/SafeImage";

const STYLE_LABEL: Record<Tour["travelStyle"], string> = {
  land: "Land Tour",
  luxury: "Luxury",
  cruise: "Cruise",
  seminar: "Seminar",
};

export default function TourCard({
  tour,
  nextDeparture,
}: {
  tour: Tour;
  nextDeparture?: Departure;
}) {
  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] shadow-2xl backdrop-blur-lg transition-all duration-500 hover:border-[rgba(125,211,252,0.2)] hover:bg-[rgba(15,21,36,0.75)]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-[#0f1524]">
        <SafeImage
          src={tour.heroImage}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#7dd3fc]">
          <span>{STYLE_LABEL[tour.travelStyle]}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{tour.durationDays} days</span>
        </div>
        <h3 className="mt-2 font-display text-xl font-bold text-[#e0e8f0]">
          {tour.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[15px] leading-7 text-[#a0b4c4]">
          {tour.summary}
        </p>
        <div className="mt-auto flex items-end justify-between border-t border-[rgba(125,211,252,0.1)] pt-4">
          <div>
            <p className="text-xs text-[#a0b4c4]">From</p>
            <p className="font-display text-lg font-bold text-[#7dd3fc]">
              {formatUsd(tour.pricing.pricePerPersonDouble)}
              <span className="text-xs font-normal text-[#a0b4c4]"> /person</span>
            </p>
          </div>
          {nextDeparture && (
            <p className="text-sm text-[#a0b4c4]">
              Next:{" "}
              {new Date(nextDeparture.startDate).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
