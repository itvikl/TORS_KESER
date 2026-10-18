import Image from "next/image";
import type { Review } from "@/lib/types";

/** One traveler letter — shared by /testimonials and the tour page's testimonials section. */
export default function TestimonialCard({ review }: { review: Review }) {
  return (
    <figure className="glass-card flex flex-col rounded-3xl p-6 shadow-2xl backdrop-blur-lg sm:p-8">
      {review.photo && (
        <div className="relative mb-5 aspect-[3/2] overflow-hidden rounded-2xl">
          <Image
            src={review.photo}
            alt={`${review.customerName} on a Keshertours trip`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
          />
        </div>
      )}
      <blockquote className="whitespace-pre-line text-[15px] leading-7 text-[var(--color-mist)]">
        &ldquo;{review.body}&rdquo;
      </blockquote>
      <figcaption className="mt-auto pt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-ice)]">
        {review.customerName}
      </figcaption>
    </figure>
  );
}
