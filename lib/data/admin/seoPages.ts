import "server-only";
import type { SeoLandingPage } from "@/lib/types";
import type { SeoPageInput } from "@/lib/validation/seoPage";
import { adminDb } from "@/lib/firebase/admin";

const SEO_PAGES_COLLECTION = "seoLandingPages";

export async function getAllSeoPagesAdmin(): Promise<SeoLandingPage[]> {
  const snapshot = await adminDb().collection(SEO_PAGES_COLLECTION).get();
  return snapshot.docs.map((doc) => doc.data() as SeoLandingPage);
}

export async function getSeoPageByIdAdmin(pageId: string): Promise<SeoLandingPage | null> {
  const doc = await adminDb().collection(SEO_PAGES_COLLECTION).doc(pageId).get();
  return doc.exists ? (doc.data() as SeoLandingPage) : null;
}

export async function isSeoSlugTaken(slug: string, excludePageId?: string): Promise<boolean> {
  const snapshot = await adminDb().collection(SEO_PAGES_COLLECTION).where("slug", "==", slug).get();
  return snapshot.docs.some((doc) => doc.id !== excludePageId);
}

export async function createSeoPageDoc(input: SeoPageInput): Promise<string> {
  const ref = adminDb().collection(SEO_PAGES_COLLECTION).doc();
  const page: SeoLandingPage = { ...input, pageId: ref.id };
  await ref.set(page);
  return ref.id;
}

export async function updateSeoPageDoc(pageId: string, input: SeoPageInput): Promise<string> {
  const ref = adminDb().collection(SEO_PAGES_COLLECTION).doc(pageId);
  const page: SeoLandingPage = { ...input, pageId };
  await ref.set(page);
  return pageId;
}
