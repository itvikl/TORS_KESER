"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { ReviewInputSchema } from "@/lib/validation/review";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import { createReviewDoc, setReviewStatusDoc, updateReviewDoc } from "@/lib/data/admin/reviews";
import type { Review } from "@/lib/types";

export type SaveReviewResult =
  | { ok: true; reviewId: string }
  | { ok: false; errors: Record<string, string[] | undefined> };

/** Creates a review, or updates the existing one when `reviewId` is passed (same shape as saveBlogPost). */
export async function saveReview(input: unknown, reviewId?: string): Promise<SaveReviewResult> {
  await requireAdminSession();

  const parsed = ReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }

  const savedId = reviewId
    ? await updateReviewDoc(reviewId, parsed.data)
    : await createReviewDoc(parsed.data);

  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/reviews/${savedId}`);
  revalidatePath("/testimonials"); // approved reviews render there

  return { ok: true, reviewId: savedId };
}

export async function setReviewStatus(reviewId: string, status: Review["status"]): Promise<void> {
  await requireAdminSession();
  await setReviewStatusDoc(reviewId, status);
  revalidatePath("/admin/reviews");
  revalidatePath("/testimonials");
}
