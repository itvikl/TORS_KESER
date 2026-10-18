import type { Metadata } from "next";
import Image from "next/image";
import PageHeader from "@/components/marketing/PageHeader";
import TestimonialCard from "@/components/marketing/TestimonialCard";
import { getSiteContent } from "@/lib/data/siteContent";
import { getTestimonialGroups } from "@/lib/data/reviews";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "What travelers say after touring with Keshertours.",
};

/**
 * Grouped by destination like the old site's testimonial hub, but on one
 * page: destination cards up top jump to their section (#<slug> — the old
 * /testemonials-<slug>/ URLs redirect to the same anchors).
 */
export default async function TestimonialsPage() {
  const [content, groups] = await Promise.all([
    getSiteContent("testimonials"),
    getTestimonialGroups(),
  ]);

  return (
    <div>
      <PageHeader eyebrow={content.eyebrow} title={content.title} lede={content.lede} />
      {groups.length === 0 ? (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg leading-8 text-[var(--color-slate)]">
            No approved reviews yet — approve one from /admin/reviews to have it appear here.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <nav aria-label="Destinations">
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {groups.map((group) => (
                <li key={group.slug}>
                  <a
                    href={`#${group.slug}`}
                    className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--color-glacier)]"
                  >
                    {group.image && (
                      <Image
                        src={group.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 270px, (min-width: 640px) 30vw, 45vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-4">
                      <span className="block text-lg font-bold leading-tight text-white">
                        {group.name}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                        {group.reviews.length} letter{group.reviews.length === 1 ? "" : "s"}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-16 space-y-16">
            {groups.map((group) => (
              <section key={group.slug} id={group.slug} className="scroll-mt-28">
                <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ice)] sm:text-3xl">
                  {group.name}
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.reviews.map(({ review }) => (
                    <TestimonialCard key={review.reviewId} review={review} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
