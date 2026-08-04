"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { TourInputSchema } from "@/lib/validation/tour";
import {
  archiveTourDoc,
  createTourDoc,
  isSlugTaken,
  setTourStatusDoc,
  updateTourDoc,
} from "@/lib/data/admin/tours";
import type { TourStatus } from "@/lib/types";

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
    // Built from `issues` (not `.flatten()`) so nested paths like
    // "kashrutDetails.supervisionLevel" come through as a single dotted
    // key — that's what TourEditorForm's Field components look up.
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      (errors[key] ??= []).push(issue.message);
    }
    return { ok: false, errors };
  }
  const data = parsed.data;

  if (await isSlugTaken(data.slug, tourId)) {
    return { ok: false, errors: { slug: ["This slug is already used by another tour."] } };
  }

  const savedId = tourId ? await updateTourDoc(tourId, data) : await createTourDoc(data);

  revalidatePath("/admin/tours");
  revalidatePath(`/admin/tours/${savedId}`);
  revalidatePath(`/tours/${data.slug}`);

  return { ok: true, tourId: savedId };
}

export async function archiveTour(tourId: string): Promise<void> {
  await requireAdminSession();
  await archiveTourDoc(tourId);
  revalidatePath("/admin/tours");
}

export async function setTourStatus(tourId: string, status: TourStatus): Promise<void> {
  await requireAdminSession();
  await setTourStatusDoc(tourId, status);
  revalidatePath("/admin/tours");
  revalidatePath(`/admin/tours/${tourId}`);
}
