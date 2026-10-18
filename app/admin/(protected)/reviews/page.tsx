import Link from "next/link";
import type { Metadata } from "next";
import { getAllReviewsAdmin } from "@/lib/data/admin/reviews";
import { getAllToursAdmin } from "@/lib/data/admin/tours";
import ReviewStatusButtons from "@/components/admin/ReviewStatusButtons";
import TestimonialDestinationsPanel from "@/components/admin/TestimonialDestinationsPanel";
import { getTestimonialGroups } from "@/lib/data/reviews";
import type { Review } from "@/lib/types";
import { IconLink } from "@/components/admin/IconAction";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const [reviews, tours, groups] = await Promise.all([
    getAllReviewsAdmin(),
    getAllToursAdmin(),
    getTestimonialGroups(),
  ]);
  const tourById = new Map(tours.map((t) => [t.tourId, t]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Reviews</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/reviews/new"
          className="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          + New review
        </Link>
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">
          No reviews yet.
        </p>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-sand-warm/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {reviews.map((review) => (
                <tr key={review.reviewId} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{review.customerName}</p>
                    <p className="max-w-xs truncate text-xs text-ink-muted">{review.body}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {tourById.get(review.tourId)?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{review.destination || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {review.rating ? "★".repeat(review.rating) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={review.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <ReviewStatusButtons review={review} />
                      <IconLink href={`/admin/reviews/${review.reviewId}`} icon="edit" label="Edit" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {groups.length > 0 && (
        <TestimonialDestinationsPanel
          destinations={groups.map((g) => ({ slug: g.slug, name: g.name, image: g.image, count: g.reviews.length }))}
        />
      )}
    </div>
  );
}

const STATUS_STYLES: Record<Review["status"], string> = {
  pending: "bg-gold/15 text-terracotta-dark",
  approved: "bg-olive/15 text-olive",
  rejected: "bg-ink-muted/15 text-ink-muted",
};

function StatusBadge({ status }: { status: Review["status"] }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
