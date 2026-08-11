"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { TourInputSchema } from "@/lib/validation/tour";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import {
  archiveTourDoc,
  createTourDoc,
  isSlugTaken,
  setTourSortOrders,
  setTourStatusDoc,
  updateTourDoc,
} from "@/lib/data/admin/tours";
import type { TourStatus } from "@/lib/types";
import { HOME_TOURS_CACHE_TAG } from "@/lib/data/homeCacheTags";

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

  if (await isSlugTaken(data.slug, tourId)) {
    return { ok: false, errors: { slug: ["This slug is already used by another tour."] } };
  }

  const savedId = tourId ? await updateTourDoc(tourId, data) : await createTourDoc(data);

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
  updateTag(HOME_TOURS_CACHE_TAG);
}

export async function setTourStatus(tourId: string, status: TourStatus): Promise<void> {
  await requireAdminSession();
  await setTourStatusDoc(tourId, status);
  revalidatePath("/admin/tours");
  revalidatePath(`/admin/tours/${tourId}`);
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
