"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/auth/dal";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UpdateUserRoleInputSchema } from "@/lib/validation/adminUser";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";

export type UpdateUserRoleResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string[] | undefined> };

/**
 * Grants admin/staff access to an *existing* Firebase Auth account (the
 * user must already have signed up/signed in once — this doesn't create a
 * new account or send an invite email, which would need its own delivery
 * flow). Mirrors what scripts/set-user-role.ts does, just as a Server
 * Action gated behind requireAdminRole() (admin-only — see lib/auth/dal.ts)
 * instead of a CLI script only the developer can run.
 */
export async function updateUserRole(input: unknown): Promise<UpdateUserRoleResult> {
  await requireAdminRole();

  const parsed = UpdateUserRoleInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }
  const { email, role } = parsed.data;

  let user;
  try {
    user = await adminAuth().getUserByEmail(email);
  } catch {
    return {
      ok: false,
      errors: { email: ["No account with this email has signed in yet."] },
    };
  }

  await adminAuth().setCustomUserClaims(user.uid, { role });
  await adminDb().collection("users").doc(user.uid).set({ email: user.email, role }, { merge: true });

  revalidatePath("/admin/staff/accounts");
  return { ok: true };
}
