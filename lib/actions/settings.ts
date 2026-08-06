"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { SiteSettingsInputSchema } from "@/lib/validation/settings";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import { updateSiteSettings } from "@/lib/data/admin/settings";

export type SaveSettingsState =
  | { ok: true }
  | { ok: false; errors: Record<string, string[] | undefined> };

export async function saveSettings(
  _prevState: SaveSettingsState,
  formData: FormData
): Promise<SaveSettingsState> {
  await requireAdminSession();

  const parsed = SiteSettingsInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }

  await updateSiteSettings(parsed.data);
  revalidatePath("/admin/settings");

  return { ok: true };
}
