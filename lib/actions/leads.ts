"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/dal";
import {
  ContactLeadInputSchema,
  CustomTourLeadInputSchema,
  ManualLeadInputSchema,
} from "@/lib/validation/lead";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import type { Lead } from "@/lib/types";

export type LeadFormState =
  | { ok: true }
  | { ok: false; errors: Record<string, string[] | undefined> };

const zodErrors = zodIssuesToFieldErrors;

async function saveLead(data: Partial<Lead> & { source: Lead["source"] }) {
  const ref = adminDb().collection("leads").doc();
  const lead: Lead = {
    leadId: ref.id,
    status: "new",
    createdAt: new Date().toISOString(),
    ...data,
  };
  await ref.set(lead);
  return lead;
}

/** Bound as the `action` of the /contact page's form via useActionState. */
export async function submitContactLead(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const parsed = ContactLeadInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: zodErrors(parsed.error.issues) };
  }

  await saveLead({ ...parsed.data, source: "contact" });
  return { ok: true };
}

/** Bound as the `action` of the /custom-made-tours page's form via useActionState. */
export async function submitCustomTourLead(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const parsed = CustomTourLeadInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: zodErrors(parsed.error.issues) };
  }

  await saveLead({ ...parsed.data, source: "custom" });
  return { ok: true };
}

/** Bound as the `action` of the admin "add lead" form (e.g. a phone inquiry). */
export async function createLeadManually(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  await requireAdminSession();

  const parsed = ManualLeadInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: zodErrors(parsed.error.issues) };
  }

  await saveLead({ ...parsed.data, source: "manual" });
  revalidatePath("/admin/leads");
  redirect("/admin/leads");
}

/** Fields staff can edit — the same ones ManualLeadInputSchema validates. */
const EDITABLE_LEAD_FIELDS = [
  "name",
  "email",
  "phone",
  "country",
  "message",
  "destination",
  "groupSize",
  "tourId",
  "status",
  "notes",
] as const;

/**
 * Bound (with the lead id) as the `action` of the admin lead edit form.
 * Every editable field is written, and a field left blank is removed —
 * otherwise clearing a field in the form would silently keep the old value.
 * Source and received date stay as they were.
 */
export async function updateLead(
  leadId: string,
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  await requireAdminSession();

  const parsed = ManualLeadInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: zodErrors(parsed.error.issues) };
  }

  const ref = adminDb().collection("leads").doc(leadId);
  if (!(await ref.get()).exists) {
    return { ok: false, errors: { form: ["This lead no longer exists."] } };
  }

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const field of EDITABLE_LEAD_FIELDS) {
    patch[field] = parsed.data[field] ?? FieldValue.delete();
  }
  await ref.update(patch);

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  redirect("/admin/leads");
}

const LEAD_STATUSES = ["new", "contacted", "converted", "closed"] as const;

/** Inline status change from the admin leads table. */
export async function updateLeadStatus(
  leadId: string,
  status: Lead["status"]
): Promise<{ ok: boolean }> {
  await requireAdminSession();
  if (!LEAD_STATUSES.includes(status)) return { ok: false };

  await adminDb().collection("leads").doc(leadId).update({ status });
  revalidatePath("/admin/leads");
  return { ok: true };
}
