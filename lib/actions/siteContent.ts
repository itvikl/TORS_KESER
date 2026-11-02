"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { saveSiteContent } from "@/lib/data/siteContent";
import { HOME_CONTENT_CACHE_TAG } from "@/lib/data/homeCacheTags";
import { revalidateAllBlogPostPages, revalidateAllTourPages } from "@/lib/revalidatePrerendered";
import {
  SiteContentAboutInputSchema,
  SiteContentContactInputSchema,
  SiteContentFaqInputSchema,
  SiteContentHomeInputSchema,
  SiteContentLegalInputSchema,
  SiteContentSimplePageInputSchema,
  copyInputSchema,
} from "@/lib/validation/siteContent";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import {
  BLOG_COPY_SECTIONS,
  BOOKING_COPY_SECTIONS,
  TESTIMONIALS_COPY_SECTIONS,
  TOUR_PAGE_COPY_SECTIONS,
  type BlogCopy,
  type BookingCopy,
  type TestimonialsCopy,
  type TourPageCopy,
} from "@/lib/siteCopy";
import type {
  SiteContentAbout,
  SiteContentContact,
  SiteContentFaq,
  SiteContentHome,
  SiteContentLegal,
  SiteContentSimplePage,
} from "@/lib/types";

export type SaveSiteContentResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string[] | undefined> };

export async function saveHomeContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = SiteContentHomeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("home", parsed.data as SiteContentHome);
  revalidatePath("/");
  updateTag(HOME_CONTENT_CACHE_TAG);
  return { ok: true };
}

export async function saveAboutContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = SiteContentAboutInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("about", parsed.data as SiteContentAbout);
  revalidatePath("/about");
  return { ok: true };
}

export async function saveCustomToursContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = SiteContentSimplePageInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("custom-tours", parsed.data as SiteContentSimplePage);
  revalidatePath("/custom-made-tours");
  return { ok: true };
}

export async function saveSpecialOffersContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = SiteContentSimplePageInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("special-offers", parsed.data as SiteContentSimplePage);
  revalidatePath("/special-offers");
  return { ok: true };
}

export async function saveTestimonialsContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = copyInputSchema(TESTIMONIALS_COPY_SECTIONS).safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("testimonials", parsed.data as TestimonialsCopy);
  revalidatePath("/testimonials");
  return { ok: true };
}

export async function saveTourPageContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = copyInputSchema(TOUR_PAGE_COPY_SECTIONS).safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("tour-page", parsed.data as TourPageCopy);
  // The booking form's date step also shows the availability wording, but
  // that page renders per request, so it needs no revalidation.
  await revalidateAllTourPages();
  return { ok: true };
}

export async function saveBookingContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = copyInputSchema(BOOKING_COPY_SECTIONS).safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("booking", parsed.data as BookingCopy);
  // Nothing to revalidate: the booking and payment-received pages render per request.
  return { ok: true };
}

export async function saveBlogContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = copyInputSchema(BLOG_COPY_SECTIONS).safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("blog", parsed.data as BlogCopy);
  revalidatePath("/");
  revalidatePath("/blog");
  await revalidateAllBlogPostPages();
  return { ok: true };
}

export async function saveFaqContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = SiteContentFaqInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("faq", parsed.data as SiteContentFaq);
  revalidatePath("/faq");
  return { ok: true };
}

export async function saveContactContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = SiteContentContactInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("contact", parsed.data as SiteContentContact);
  revalidatePath("/contact");
  return { ok: true };
}

export async function saveLegalPrivacyContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = SiteContentLegalInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("legal-privacy", parsed.data as SiteContentLegal);
  revalidatePath("/legal/privacy");
  return { ok: true };
}

export async function saveLegalTermsContent(input: unknown): Promise<SaveSiteContentResult> {
  await requireAdminSession();
  const parsed = SiteContentLegalInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  await saveSiteContent("legal-terms", parsed.data as SiteContentLegal);
  revalidatePath("/legal/terms-conditions");
  return { ok: true };
}
