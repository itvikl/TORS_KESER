"use server";

import { revalidatePath } from "next/cache";
import type { UserRecord } from "firebase-admin/auth";
import { requireAccountManager } from "@/lib/auth/dal";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { listAdminUsersAdmin } from "@/lib/data/admin/adminUsers";
import { assignableRoles, canManageAccount, roleLabel, type AdminRole } from "@/lib/auth/roles";
import { AddAdminAccountInputSchema, ChangeAccountRoleInputSchema } from "@/lib/validation/adminUser";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";

/**
 * Admin account management — developers and super admins only
 * (requireAccountManager). Super admins can't create, change or delete a
 * developer; only a developer can (lib/auth/roles.ts). Nobody changes or
 * deletes their own account here, so there's always at least one account
 * manager left.
 */

export type AddAdminAccountResult =
  | { ok: true; created: boolean }
  | { ok: false; errors: Record<string, string[] | undefined> };

export type AccountActionResult = { ok: true } | { ok: false; error: string };

const ACCOUNTS_PATH = "/admin/staff/accounts";

/**
 * Sets the custom claim (read by proxy.ts and lib/auth/dal.ts) and the
 * users/{uid} mirror. When an existing role changes, the account's sessions
 * are revoked so the new permissions apply at once instead of at their next
 * sign-in.
 */
async function grantRole(user: UserRecord, role: AdminRole) {
  const previous = user.customClaims?.role;
  await adminAuth().setCustomUserClaims(user.uid, { ...user.customClaims, role });
  await adminDb().collection("users").doc(user.uid).set({ email: user.email, role }, { merge: true });
  if (previous && previous !== role) await adminAuth().revokeRefreshTokens(user.uid);
}

/**
 * "Add account": creates the Firebase Auth login (email + password) when the
 * email has none yet, then grants the role. For an email that already has a
 * login, only the role changes — its password is left alone. No invite email
 * is sent; the password is shared by hand.
 */
export async function addAdminAccount(input: unknown): Promise<AddAdminAccountResult> {
  const session = await requireAccountManager();

  const parsed = AddAdminAccountInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }
  const { email, role, password } = parsed.data;

  if (!assignableRoles(session.role).includes(role)) {
    return { ok: false, errors: { role: [`You can't give the ${roleLabel(role)} role.`] } };
  }

  let user: UserRecord | null = null;
  try {
    user = await adminAuth().getUserByEmail(email);
  } catch {
    user = null;
  }

  let created = false;
  if (user) {
    if (user.uid === session.uid) {
      return { ok: false, errors: { email: ["You can't change your own role."] } };
    }
    if (!canManageAccount(session.role, user.customClaims?.role)) {
      return { ok: false, errors: { email: ["Only a developer can change a developer's account."] } };
    }
  } else {
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
  revalidatePath(ACCOUNTS_PATH);
  return { ok: true, created };
}

/** Role dropdown on each Admin accounts row. */
export async function changeAccountRole(input: unknown): Promise<AccountActionResult> {
  const session = await requireAccountManager();

  const parsed = ChangeAccountRoleInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a valid role." };
  const { uid, role } = parsed.data;

  if (uid === session.uid) return { ok: false, error: "You can't change your own role." };
  if (!assignableRoles(session.role).includes(role)) {
    return { ok: false, error: `You can't give the ${roleLabel(role)} role.` };
  }

  const user = await adminAuth().getUser(uid).catch(() => null);
  if (!user) return { ok: false, error: "Account not found." };
  if (!canManageAccount(session.role, user.customClaims?.role)) {
    return { ok: false, error: "Only a developer can change a developer's account." };
  }

  await grantRole(user, role);
  revalidatePath(ACCOUNTS_PATH);
  return { ok: true };
}

/**
 * "Reset 2FA", for someone who lost their authenticator: removes their
 * enrolled second factors and revokes their sessions, so they set up a new
 * authenticator on their next sign-in. Not on your own account (another
 * manager does it, so a stolen password alone can't strip 2FA).
 */
export async function resetAdminTwoFactor(uid: string): Promise<AccountActionResult> {
  const session = await requireAccountManager();
  if (uid === session.uid) {
    return { ok: false, error: "Ask another super admin or developer to reset your own 2FA." };
  }

  const users = await listAdminUsersAdmin();
  const target = users.find((u) => u.uid === uid);
  if (!target) return { ok: false, error: "Account not found." };
  if (!canManageAccount(session.role, target.role)) {
    return { ok: false, error: "Only a developer can reset a developer's 2FA." };
  }

  await adminAuth().updateUser(uid, { multiFactor: { enrolledFactors: null } });
  await adminAuth().revokeRefreshTokens(uid);

  revalidatePath(ACCOUNTS_PATH);
  return { ok: true };
}

/**
 * Deletes an admin login entirely (Firebase Auth user + users/{uid} mirror).
 * Their session stops working on the next request — getAdminSession verifies
 * the cookie with revocation checks. Never your own account, and a super
 * admin can't delete a developer.
 */
export async function deleteAdminAccount(uid: string): Promise<AccountActionResult> {
  const session = await requireAccountManager();

  if (uid === session.uid) {
    return { ok: false, error: "You can't delete your own account." };
  }

  const users = await listAdminUsersAdmin();
  const target = users.find((u) => u.uid === uid);
  if (!target) return { ok: false, error: "Account not found." };
  if (!canManageAccount(session.role, target.role)) {
    return { ok: false, error: "Only a developer can delete a developer's account." };
  }

  try {
    await adminAuth().deleteUser(uid);
  } catch (error) {
    // Already gone from Auth — still clear the Firestore mirror below.
    if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
  }
  await adminDb().collection("users").doc(uid).delete();

  revalidatePath(ACCOUNTS_PATH);
  return { ok: true };
}
