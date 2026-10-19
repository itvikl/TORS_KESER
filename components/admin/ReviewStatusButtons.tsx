"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReviewStatus } from "@/lib/actions/reviews";
import type { Review } from "@/lib/types";
import { IconButton } from "@/components/admin/IconAction";
import { useToast } from "@/components/admin/feedback/AdminFeedbackProvider";

export default function ReviewStatusButtons({ review }: { review: Review }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function change(status: Review["status"]) {
    startTransition(async () => {
      try {
        await setReviewStatus(review.reviewId, status);
        toast.success(
          status === "approved"
            ? { title: "Review approved", description: `${review.customerName}'s review is now visible on the site.` }
            : { title: "Review rejected", description: `${review.customerName}'s review was hidden from the site.` }
        );
        router.refresh();
      } catch {
        toast.error({ title: "Couldn't update review", description: "Something went wrong — please try again." });
      }
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
