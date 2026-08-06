"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
