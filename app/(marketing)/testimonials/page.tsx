import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import { getSiteContent } from "@/lib/data/siteContent";
import { getApprovedReviews } from "@/lib/data/reviews";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "What travelers say after touring with Keshertours.",
};

export default async function TestimonialsPage() {
  const [content, reviews] = await Promise.all([
    getSiteContent("testimonials"),
    getApprovedReviews(),
  ]);

  return (
    <div>
      <PageHeader eyebrow={content.eyebrow} title={content.title} lede={content.lede} />
      {reviews.length === 0 ? (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg leading-8 text-[#a0b4c4]">
            No approved reviews yet — approve one from /admin/reviews to have it appear here.
          </p>
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {reviews.map(({ review, tour }) => (
            <figure
              key={review.reviewId}
              className="rounded-3xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] p-6 shadow-2xl backdrop-blur-lg transition-all duration-300 hover:border-[rgba(125,211,252,0.2)] hover:bg-[rgba(15,21,36,0.75)] sm:p-8"
            >
              <blockquote className="text-[15px] leading-7 text-[#e0e8f0]">
                &ldquo;{review.body}&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">
                {tour?.title ?? review.customerName}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
