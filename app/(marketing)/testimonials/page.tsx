import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import TestimonialQuote from "@/components/marketing/TestimonialQuote";
import { getSiteContent } from "@/lib/data/siteContent";
import { getApprovedReviews } from "@/lib/data/reviews";
import { destinationSlug, reviewDestination } from "@/lib/testimonials";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent("testimonials");
  return {
    title: "Testimonials",
    description: content.metaDescription,
    alternates: { canonical: "/testimonials" },
  };
}

/**
 * One continuous list of traveler letters — not split by tour or destination.
 * The old site's /testemonials-<slug>/ URLs redirect to /testimonials#<slug>,
 * so each destination's first letter carries that id and those links still
 * land on a relevant quote.
 */
export default async function TestimonialsPage() {
  const [content, reviews] = await Promise.all([
    getSiteContent("testimonials"),
    getApprovedReviews(),
  ]);

  const anchored = new Set<string>();
  const items = reviews.map(({ review, tour }) => {
    const slug = destinationSlug(reviewDestination(review, tour));
    const id = anchored.has(slug) ? undefined : slug;
    anchored.add(slug);
    return { review, tour, id };
  });

  return (
    <div>
      <PageHeader eyebrow={content.eyebrow || undefined} title={content.title} lede={content.lede || undefined} image={content.heroImage} />
      {items.length === 0 ? (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg leading-8 text-[var(--color-slate)]">
            {content.emptyMessage}
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl space-y-8 px-4 py-16 sm:px-6 lg:px-8">
          {items.map(({ review, tour, id }) => (
            <TestimonialQuote key={review.reviewId} review={review} tour={tour} id={id} />
          ))}
        </div>
      )}
    </div>
  );
}
