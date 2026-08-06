"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { OfferInputSchema } from "@/lib/validation/offer";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import { createOfferDoc, updateOfferDoc } from "@/lib/data/admin/offers";

export type SaveOfferResult =
  | { ok: true; offerId: string }
  | { ok: false; errors: Record<string, string[] | undefined> };

export async function saveOffer(input: unknown, offerId?: string): Promise<SaveOfferResult> {
  await requireAdminSession();

  const parsed = OfferInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }

  const savedId = offerId
    ? await updateOfferDoc(offerId, parsed.data)
    : await createOfferDoc(parsed.data);

  revalidatePath("/admin/offers");
  revalidatePath(`/admin/offers/${savedId}`);
  revalidatePath("/special-offers");

  return { ok: true, offerId: savedId };
}
