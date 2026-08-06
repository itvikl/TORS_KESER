"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { StaffInputSchema } from "@/lib/validation/staff";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import { createStaffDoc, updateStaffDoc } from "@/lib/data/admin/staff";

export type SaveStaffResult =
  | { ok: true; staffId: string }
  | { ok: false; errors: Record<string, string[] | undefined> };

/** Operational staff (guides/kashrut supervisors) — not to be confused with the admin/staff login role in lib/actions/adminUsers.ts. */
export async function saveStaffMember(input: unknown, staffId?: string): Promise<SaveStaffResult> {
  await requireAdminSession();

  const parsed = StaffInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }

  const savedId = staffId
    ? await updateStaffDoc(staffId, parsed.data)
    : await createStaffDoc(parsed.data);

  revalidatePath("/admin/staff/team");

  return { ok: true, staffId: savedId };
}
