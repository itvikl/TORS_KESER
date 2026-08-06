"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReviewStatus } from "@/lib/actions/reviews";
import type { Review } from "@/lib/types";

export default function ReviewStatusButtons({ review }: { review: Review }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(status: Review["status"]) {
    startTransition(async () => {
      await setReviewStatus(review.reviewId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-3">
      {review.status !== "approved" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => change("approved")}
          className="text-sm font-medium text-olive hover:underline disabled:opacity-60"
        >
          Approve
        </button>
      )}
      {review.status !== "rejected" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => change("rejected")}
          className="text-sm font-medium text-terracotta-dark hover:underline disabled:opacity-60"
        >
          Reject
        </button>
      )}
    </div>
  );
}
