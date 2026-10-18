"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReviewStatus } from "@/lib/actions/reviews";
import type { Review } from "@/lib/types";
import { IconButton } from "@/components/admin/IconAction";

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
    <div className="flex items-center justify-end gap-1">
      {review.status !== "approved" && (
        <IconButton
          icon="check"
          label="Approve (show on site)"
          tone="success"
          disabled={pending}
          onClick={() => change("approved")}
        />
      )}
      {review.status !== "rejected" && (
        <IconButton
          icon="x"
          label="Reject (hide from site)"
          tone="danger"
          disabled={pending}
          onClick={() => change("rejected")}
        />
      )}
    </div>
  );
}
