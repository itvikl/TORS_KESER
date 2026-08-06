"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { ReviewInputSchema } from "@/lib/validation/review";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import { createReviewDoc, setReviewStatusDoc } from "@/lib/data/admin/reviews";
import type { Review } from "@/lib/types";

export type SaveReviewResult =
  | { ok: true; reviewId: string }
  | { ok: false; errors: Record<string, string[] | undefined> };

export async function saveReview(input: unknown): Promise<SaveReviewResult> {
  await requireAdminSession();

  const parsed = ReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }

  const reviewId = await createReviewDoc(parsed.data);
  revalidatePath("/admin/reviews");

  return { ok: true, reviewId };
}

export async function setReviewStatus(reviewId: string, status: Review["status"]): Promise<void> {
  await requireAdminSession();
  await setReviewStatusDoc(reviewId, status);
  revalidatePath("/admin/reviews");
}
