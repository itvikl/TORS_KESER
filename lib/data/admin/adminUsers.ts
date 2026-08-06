import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { ADMIN_ROLES } from "@/lib/auth/constants";
import type { UserRole } from "@/lib/types";

export interface AdminUserRow {
  uid: string;
  email: string | null;
  role: UserRole;
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
