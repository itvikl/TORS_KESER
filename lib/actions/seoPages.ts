"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { SeoPageInputSchema } from "@/lib/validation/seoPage";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import { createSeoPageDoc, isSeoSlugTaken, updateSeoPageDoc } from "@/lib/data/admin/seoPages";

export type SaveSeoPageResult =
  | { ok: true; pageId: string }
  | { ok: false; errors: Record<string, string[] | undefined> };

export async function saveSeoPage(input: unknown, pageId?: string): Promise<SaveSeoPageResult> {
  await requireAdminSession();

  const parsed = SeoPageInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }
  const data = parsed.data;

  if (await isSeoSlugTaken(data.slug, pageId)) {
    return { ok: false, errors: { slug: ["This slug is already used by another page."] } };
  }

  const savedId = pageId ? await updateSeoPageDoc(pageId, data) : await createSeoPageDoc(data);

  revalidatePath("/admin/seo-pages");
  revalidatePath(`/admin/seo-pages/${savedId}`);

  return { ok: true, pageId: savedId };
}
