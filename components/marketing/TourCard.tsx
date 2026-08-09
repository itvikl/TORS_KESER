import Link from "next/link";
import type { Departure, Tour } from "@/lib/types";
import SafeImage from "@/components/ui/SafeImage";

export default function TourCard({
  tour,
  nextDeparture,
  image,
}: {
  tour: Tour;
  nextDeparture?: Departure;
  image: string;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] shadow-2xl backdrop-blur-lg transition-all duration-500 hover:border-[rgba(125,211,252,0.2)] hover:bg-[rgba(15,21,36,0.75)]">
      <div className="relative h-72 overflow-hidden">
        <SafeImage
          src={image}
          alt={tour.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute left-4 top-4 rounded-full border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#e0e8f0] backdrop-blur-lg">
          {tour.region}
        </div>
        {tour.isSpecialOffer && (
          <div className="absolute right-4 top-4 rounded-full bg-[#f4b942] px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#0f1524] shadow-lg">
            Special Offer
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-[#e0e8f0]">{tour.title}</h3>
          <span className="shrink-0 text-sm font-bold text-[#7dd3fc]">
            From ${tour.pricing.pricePerPersonDouble.toLocaleString()}
          </span>
        </div>

        <p className="mb-8 text-sm leading-relaxed text-[#a0b4c4]">{tour.summary}</p>

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
  );
}
