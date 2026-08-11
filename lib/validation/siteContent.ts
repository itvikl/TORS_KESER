import * as z from "zod";

const TrustSignalInputSchema = z.object({
  title: z.string().min(1, { error: "Required." }),
  body: z.string().min(1, { error: "Required." }),
});

export const SiteContentHomeInputSchema = z.object({
  heroEyebrow: z.string().min(1, { error: "Required." }),
  heroTitleLine1: z.string().min(1, { error: "Required." }),
  heroTitleHighlight: z.string().min(1, { error: "Required." }),
  heroSubtitle: z.string().min(1, { error: "Required." }),
  heroPrimaryCta: z.string().min(1, { error: "Required." }),
  heroSecondaryCta: z.string().min(1, { error: "Required." }),
  trustSignals: z.tuple([TrustSignalInputSchema, TrustSignalInputSchema, TrustSignalInputSchema]),
  ctaHeading: z.string().min(1, { error: "Required." }),
  ctaHeadingHighlight: z.string().min(1, { error: "Required." }),
  ctaBody: z.string().min(1, { error: "Required." }),
  ctaPrimaryButton: z.string().min(1, { error: "Required." }),
  ctaSecondaryButton: z.string().min(1, { error: "Required." }),
});

const SiteContentSectionInputSchema = z.object({
  sectionId: z.string().min(1),
  heading: z.string().min(1, { error: "Required." }),
  body: z.string().min(1, { error: "Required." }),
});

export const SiteContentAboutInputSchema = z.object({
  eyebrow: z.string().min(1, { error: "Required." }),
  title: z.string().min(1, { error: "Required." }),
  lede: z.string().min(1, { error: "Required." }),
  sections: z.array(SiteContentSectionInputSchema).min(1, { error: "Add at least one section." }),
});

export const SiteContentSimplePageInputSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().min(1, { error: "Required." }),
  lede: z.string().optional(),
});

const SiteContentFaqItemInputSchema = z.object({
  itemId: z.string().min(1),
  question: z.string().min(1, { error: "Required." }),
  answer: z.string().min(1, { error: "Required." }),
});

export const SiteContentFaqInputSchema = z.object({
  title: z.string().min(1, { error: "Required." }),
  lede: z.string().optional(),
  items: z.array(SiteContentFaqItemInputSchema).min(1, { error: "Add at least one question." }),
});

export const SiteContentContactInputSchema = z.object({
  title: z.string().min(1, { error: "Required." }),
  lede: z.string().min(1, { error: "Required." }),
});

export const SiteContentLegalInputSchema = z.object({
  title: z.string().min(1, { error: "Required." }),
  body: z.string().min(1, { error: "Required." }),
});
