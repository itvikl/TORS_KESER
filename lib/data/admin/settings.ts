import "server-only";
import type { SiteSettings } from "@/lib/types";
import type { SiteSettingsInput } from "@/lib/validation/settings";
import { adminDb } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "siteSettings";
const SETTINGS_DOC_ID = "default";

const DEFAULT_SETTINGS: SiteSettings = {
  phone: "1-800-847-0700",
  phoneAlt: "1-212-481-3721",
  email: undefined,
  defaultDepositAmount: 0,
  defaultMinGroupSize: 0,
  defaultBalanceDueDays: 0,
  defaultCompanyCancelDeadlineDays: 0,
  lowSeatsThreshold: 7,
};

/**
 * Singleton document (PRD siteSettings/{singleton}) — one form, not a list+CRUD pattern.
 * Merges over DEFAULT_SETTINGS (rather than only falling back when the doc
 * doesn't exist at all) so a field added after the doc was first created —
 * like lowSeatsThreshold — has a sane value immediately, with no manual
 * migration step.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const doc = await adminDb().collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get();
  return doc.exists
    ? { ...DEFAULT_SETTINGS, ...(doc.data() as Partial<SiteSettings>) }
    : DEFAULT_SETTINGS;
}

export async function updateSiteSettings(input: SiteSettingsInput): Promise<void> {
  await adminDb().collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).set(input);
}
