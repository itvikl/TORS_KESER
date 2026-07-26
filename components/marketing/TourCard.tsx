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
      className="group block overflow-hidden rounded-2xl border border-line bg-white/60 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-sand-warm">
        <SafeImage
          src={tour.heroImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-olive">
          <span>{STYLE_LABEL[tour.travelStyle]}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{tour.durationDays} days</span>
        </div>
        <h3 className="mt-2 font-display text-xl font-semibold text-navy">
          {tour.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[15px] text-ink-muted">
          {tour.summary}
        </p>
        <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
          <div>
            <p className="text-xs text-ink-muted">From</p>
            <p className="font-display text-lg font-semibold text-terracotta">
              {formatUsd(tour.pricing.pricePerPersonDouble)}
              <span className="text-xs font-normal text-ink-muted"> /person</span>
            </p>
          </div>
          {nextDeparture && (
            <p className="text-sm text-ink-muted">
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
