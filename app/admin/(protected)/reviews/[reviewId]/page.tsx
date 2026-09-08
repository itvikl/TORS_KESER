import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReviewForm from "@/components/admin/ReviewForm";
import { getReviewByIdAdmin } from "@/lib/data/admin/reviews";
import { getAllToursAdmin } from "@/lib/data/admin/tours";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}): Promise<Metadata> {
  const { reviewId } = await params;
  const review = await getReviewByIdAdmin(reviewId);
  return { title: review ? `Edit — ${review.customerName}` : "Review" };
}

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  const [review, tours] = await Promise.all([getReviewByIdAdmin(reviewId), getAllToursAdmin()]);
  if (!review) notFound();
  tours.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{review.customerName}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Editing an existing review — changes appear on the public testimonials page once approved.
        </p>
      </div>
      <ReviewForm tours={tours} reviewId={reviewId} initialReview={review} />
    </div>
  );
}
