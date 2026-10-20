import "server-only";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ADMIN_ROLES } from "@/lib/auth/constants";
import type { UserRole } from "@/lib/types";

export interface AdminUserRow {
  uid: string;
  email: string | null;
  role: UserRole;
}

/** uids (of those given) that have an authenticator app enrolled as a second factor. */
export async function getTwoFactorUidsAdmin(uids: string[]): Promise<Set<string>> {
  const enrolled = new Set<string>();
  // getUsers() takes at most 100 identifiers per call.
  for (let i = 0; i < uids.length; i += 100) {
    const { users } = await adminAuth().getUsers(uids.slice(i, i + 100).map((uid) => ({ uid })));
    for (const user of users) {
      if (user.multiFactor?.enrolledFactors.length) enrolled.add(user.uid);
    }
  }
  return enrolled;
}

/**
 * Reads from the Firestore users/{userId} mirror (kept in sync with the
 * Firebase Auth custom claim by updateUserRole / scripts/set-user-role.ts)
 * rather than Auth's listUsers(), which would require paging through every
 * account just to filter down to admin/staff.
 */
export async function listAdminUsersAdmin(): Promise<AdminUserRow[]> {
  const snapshot = await adminDb()
    .collection("users")
    .where("role", "in", [...ADMIN_ROLES])
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as { email?: string; role: UserRole };
    return { uid: doc.id, email: data.email ?? null, role: data.role };
  });
}
