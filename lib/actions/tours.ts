"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { syncContentMediaSafely } from "@/lib/data/admin/mediaLibrary";
import { requireAdminSession } from "@/lib/auth/dal";
import { TourInputSchema } from "@/lib/validation/tour";
import { singleSupplementOf } from "@/lib/pricing";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import {
  archiveTourDoc,
  createTourDoc,
  duplicateTourDoc,
  isSlugTaken,
  setTourSortOrders,
  setTourStatusDoc,
  updateTourDoc,
} from "@/lib/data/admin/tours";
import { isReadyToPublish } from "@/lib/validation/tourChecklist";
import type { Tour, TourStatus } from "@/lib/types";
import { HOME_TOURS_CACHE_TAG } from "@/lib/data/homeCacheTags";
import { revalidateAllTourPages } from "@/lib/revalidatePrerendered";

export type SaveTourResult =
  | { ok: true; tourId: string }
  | { ok: false; errors: Record<string, string[] | undefined> };

/**
 * Called directly from the admin tour editor (a Client Component) rather
 * than via a <form action>, since the editor's state is a nested object
 * (itinerary days, pricing, kashrut) that doesn't map cleanly to FormData.
 * Next.js Server Actions can be invoked as plain async functions from
 * client code, not only through forms.
 */
export async function saveTour(input: unknown, tourId?: string): Promise<SaveTourResult> {
  await requireAdminSession();

  const parsed = TourInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }
  const data = parsed.data;
  data.pricing.singleSupplement = singleSupplementOf(data.pricing);

  // Defense in depth behind the editor's own gate: a live tour must always
  // satisfy the publish checklist (a published tour with no deposit, say,
  // could take bookings it can't charge for).
  if (data.status === "published" && !isReadyToPublish(data as unknown as Tour)) {
    return { ok: false, errors: { status: ["A published tour must have everything on the publish checklist."] } };
  }

  if (await isSlugTaken(data.slug, tourId)) {
    return { ok: false, errors: { slug: ["This slug is already used by another tour."] } };
  }

  const savedId = tourId ? await updateTourDoc(tourId, data) : await createTourDoc(data);
  await syncContentMediaSafely("tours", savedId);

  revalidatePath("/admin/tours");
  revalidatePath(`/admin/tours/${savedId}`);
  revalidatePath(`/tours/${data.slug}`);
  updateTag(HOME_TOURS_CACHE_TAG);

  return { ok: true, tourId: savedId };
}

export async function archiveTour(tourId: string): Promise<void> {
  await requireAdminSession();
  await archiveTourDoc(tourId);
  revalidatePath("/admin/tours");
  // The public page now redirects (archived) instead of rendering — drop its cached copy.
  await revalidateAllTourPages();
  updateTag(HOME_TOURS_CACHE_TAG);
}

export async function setTourStatus(tourId: string, status: TourStatus): Promise<void> {
  await requireAdminSession();
  await setTourStatusDoc(tourId, status);
  revalidatePath("/admin/tours");
  revalidatePath(`/admin/tours/${tourId}`);
  // Publishing/archiving flips the public page between rendering and
  // redirecting — drop the cached copy so the change shows immediately.
  await revalidateAllTourPages();
  updateTag(HOME_TOURS_CACHE_TAG);
}

export async function reorderTours(orderedTourIds: string[]): Promise<{ ok: boolean }> {
  await requireAdminSession();
  await setTourSortOrders(orderedTourIds);
  revalidatePath("/admin/tours");
  revalidatePath("/");
  updateTag(HOME_TOURS_CACHE_TAG);
  return { ok: true };
}

/** Creates a draft copy of a tour (content only, no departures) and opens it in the editor. */
export async function duplicateTour(tourId: string): Promise<{ ok: false; error: string }> {
  await requireAdminSession();
  const newTourId = await duplicateTourDoc(tourId);
  if (!newTourId) return { ok: false, error: "Tour not found." };
  await syncContentMediaSafely("tours", newTourId);
  revalidatePath("/admin/tours");
  redirect(`/admin/tours/${newTourId}`);
}
