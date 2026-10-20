"use server";

import { revalidatePath } from "next/cache";
import type { UserRecord } from "firebase-admin/auth";
import { requireAdminRole } from "@/lib/auth/dal";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { listAdminUsersAdmin } from "@/lib/data/admin/adminUsers";
import { AddAdminAccountInputSchema, UpdateUserRoleInputSchema } from "@/lib/validation/adminUser";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";

export type UpdateUserRoleResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string[] | undefined> };

export type AddAdminAccountResult =
  | { ok: true; created: boolean }
  | { ok: false; errors: Record<string, string[] | undefined> };

async function grantRole(user: UserRecord, role: "staff" | "admin") {
  await adminAuth().setCustomUserClaims(user.uid, { role });
  await adminDb().collection("users").doc(user.uid).set({ email: user.email, role }, { merge: true });
}

/**
 * Grants admin/staff access to an *existing* Firebase Auth account. Mirrors
 * scripts/set-user-role.ts, gated behind requireAdminRole() (admin-only —
 * see lib/auth/dal.ts). addAdminAccount below also creates the login.
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

  await grantRole(user, role);
  revalidatePath("/admin/staff/accounts");
  return { ok: true };
}

/**
 * "Add account" on Admin accounts: creates the Firebase Auth login (email +
 * password) when the email has none yet, then grants the role. For an email
 * that already has a login, only the role changes — its password is left
 * alone. No invite email is sent; staff share the password themselves.
 */
export async function addAdminAccount(input: unknown): Promise<AddAdminAccountResult> {
  await requireAdminRole();

  const parsed = AddAdminAccountInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }
  const { email, role, password } = parsed.data;

  let user: UserRecord | null = null;
  try {
    user = await adminAuth().getUserByEmail(email);
  } catch {
    user = null;
  }

  let created = false;
  if (!user) {
    if (!password) {
      return {
        ok: false,
        errors: { password: ["This email has no login yet — set a password to create one."] },
      };
    }
    user = await adminAuth().createUser({ email, password, emailVerified: true });
    created = true;
  }

  await grantRole(user, role);
  revalidatePath("/admin/staff/accounts");
  return { ok: true, created };
}

/**
 * "Reset 2FA" on Admin accounts, for someone who lost their authenticator:
 * removes their enrolled second factors and revokes their sessions, so they
 * set up a new authenticator on their next sign-in. Admin-only, and not on
 * your own account (another admin does it, so a stolen password alone can't
 * strip 2FA).
 */
export async function resetAdminTwoFactor(uid: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAdminRole();
  if (uid === session.uid) {
    return { ok: false, error: "Ask another admin to reset your own 2FA." };
  }

  const users = await listAdminUsersAdmin();
  if (!users.some((u) => u.uid === uid)) return { ok: false, error: "Account not found." };

  await adminAuth().updateUser(uid, { multiFactor: { enrolledFactors: null } });
  await adminAuth().revokeRefreshTokens(uid);

  revalidatePath("/admin/staff/accounts");
  return { ok: true };
}

/**
 * Deletes an admin/staff login entirely (Firebase Auth user + users/{uid}
 * mirror). Their session stops working on the next request — getAdminSession
 * verifies the cookie with revocation checks. Refuses to delete your own
 * account or the last remaining admin, so nobody can lock everyone out.
 */
export async function deleteAdminAccount(uid: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAdminRole();

  if (uid === session.uid) {
    return { ok: false, error: "You can't delete your own account." };
  }

  const users = await listAdminUsersAdmin();
  const target = users.find((u) => u.uid === uid);
  if (!target) return { ok: false, error: "Account not found." };
  if (target.role === "admin" && users.filter((u) => u.role === "admin").length <= 1) {
    return { ok: false, error: "You can't delete the last admin." };
  }

  try {
    await adminAuth().deleteUser(uid);
  } catch (error) {
    // Already gone from Auth — still clear the Firestore mirror below.
    if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
  }
  await adminDb().collection("users").doc(uid).delete();

  revalidatePath("/admin/staff/accounts");
  return { ok: true };
}
