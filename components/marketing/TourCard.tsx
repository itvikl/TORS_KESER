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
    <article className="glass-card group flex flex-col overflow-hidden rounded-3xl shadow-2xl backdrop-blur-lg duration-500">
      <div className="relative h-72 overflow-hidden">
        <SafeImage
          src={image}
          alt={tour.title}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute left-4 top-4 rounded-full border border-[var(--color-border-ice)] bg-[var(--color-surface)] px-4 py-1 text-xs font-bold uppercase tracking-widest text-[var(--color-mist)] backdrop-blur-lg">
          {tour.region}
        </div>
        {tour.isSpecialOffer && (
          <div className="absolute right-4 top-4 rounded-full bg-[var(--color-offer-gold)] px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#0f1524] shadow-lg">
            Special Offer
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-[var(--color-mist)]">{tour.title}</h3>
          <span className="shrink-0 text-sm font-bold text-[var(--color-ice)]">
            From ${tour.pricing.pricePerPersonDouble.toLocaleString()}
          </span>
        </div>

        <p className="mb-8 text-sm leading-relaxed text-[var(--color-slate)]">{tour.summary}</p>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border-hairline-faint)] pt-4">
          <div className="text-xs font-semibold text-[var(--color-slate)]">
            {nextDeparture
              ? `Departs ${new Date(nextDeparture.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}`
              : "Flexible dates"}
          </div>
          <Link
            href={`/tours/${tour.slug}`}
            className="flex items-center gap-1 text-sm font-bold text-[var(--color-ice)] transition-all group-hover:gap-2"
          >
            View Details <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
