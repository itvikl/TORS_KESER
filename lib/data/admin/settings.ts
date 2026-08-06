import "server-only";
import type { SiteSettings } from "@/lib/types";
import type { SiteSettingsInput } from "@/lib/validation/settings";
import { adminDb } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "siteSettings";
const SETTINGS_DOC_ID = "default";

const DEFAULT_SETTINGS: SiteSettings = {
  phone: "",
  phoneAlt: undefined,
  email: undefined,
  defaultDepositAmount: 0,
  defaultMinGroupSize: 0,
  defaultBalanceDueDays: 0,
  defaultCompanyCancelDeadlineDays: 0,
};

/** Singleton document (PRD siteSettings/{singleton}) — one form, not a list+CRUD pattern. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const doc = await adminDb().collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get();
  return doc.exists ? (doc.data() as SiteSettings) : DEFAULT_SETTINGS;
}

export async function updateSiteSettings(input: SiteSettingsInput): Promise<void> {
  await adminDb().collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).set(input);
}
