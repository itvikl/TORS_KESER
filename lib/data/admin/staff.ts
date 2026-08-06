import "server-only";
import type { Staff } from "@/lib/types";
import type { StaffInput } from "@/lib/validation/staff";
import { adminDb } from "@/lib/firebase/admin";

const STAFF_COLLECTION = "staff";

export async function getAllStaffAdmin(): Promise<Staff[]> {
  const snapshot = await adminDb().collection(STAFF_COLLECTION).get();
  return snapshot.docs.map((doc) => doc.data() as Staff);
}

export async function getStaffByIdAdmin(staffId: string): Promise<Staff | null> {
  const doc = await adminDb().collection(STAFF_COLLECTION).doc(staffId).get();
  return doc.exists ? (doc.data() as Staff) : null;
}

export async function createStaffDoc(input: StaffInput): Promise<string> {
  const ref = adminDb().collection(STAFF_COLLECTION).doc();
  const staff: Staff = { ...input, staffId: ref.id };
  await ref.set(staff);
  return ref.id;
}

export async function updateStaffDoc(staffId: string, input: StaffInput): Promise<string> {
  const ref = adminDb().collection(STAFF_COLLECTION).doc(staffId);
  const staff: Staff = { ...input, staffId };
  await ref.set(staff);
  return staffId;
}
