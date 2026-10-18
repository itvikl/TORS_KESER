"use server";

import { revalidatePath } from "next/cache";
import { syncContentMediaSafely } from "@/lib/data/admin/mediaLibrary";
import { requireAdminSession } from "@/lib/auth/dal";
import { ReviewInputSchema } from "@/lib/validation/review";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import {
  createReviewDoc,
  setReviewStatusDoc,
  setTestimonialDestinationImageDoc,
  updateReviewDoc,
} from "@/lib/data/admin/reviews";
import { destinationSlug } from "@/lib/testimonials";
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
  await syncContentMediaSafely("reviews", savedId);

  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/reviews/${savedId}`);
  revalidatePath("/testimonials"); // approved reviews render there
  revalidatePath("/tours/[slug]", "page"); // …and on their destination's tour pages

  return { ok: true, reviewId: savedId };
}

export async function setReviewStatus(reviewId: string, status: Review["status"]): Promise<void> {
  await requireAdminSession();
  await setReviewStatusDoc(reviewId, status);
  revalidatePath("/admin/reviews");
  revalidatePath("/testimonials");
  revalidatePath("/tours/[slug]", "page");
}

/** Destination photo on /testimonials; pass no image to go back to the default (the most-reviewed tour's hero). */
export async function setTestimonialDestinationImage(
  name: string,
  image?: string
): Promise<{ ok: boolean }> {
  await requireAdminSession();
  const slug = destinationSlug(name);
  if (!slug || (image && !/^https:\/\//.test(image))) return { ok: false };
  await setTestimonialDestinationImageDoc(slug, name.trim(), image);
  await syncContentMediaSafely("testimonialDestinations", slug);
  revalidatePath("/admin/reviews");
  revalidatePath("/testimonials");
  return { ok: true };
}
