import * as z from "zod";
import { placeholdersIn, type CopySection } from "@/lib/siteCopy";

const TrustSignalInputSchema = z.object({
  title: z.string().min(1, { error: "Required." }),
  body: z.string().min(1, { error: "Required." }),
});

export const SiteContentHomeInputSchema = z.object({
  heroImage: z.string().min(1, { error: "Choose a hero image." }),
  heroEyebrow: z.string().min(1, { error: "Required." }),
  heroTitleLine1: z.string().min(1, { error: "Required." }),
  heroTitleHighlight: z.string().min(1, { error: "Required." }),
  heroSubtitle: z.string().min(1, { error: "Required." }),
  heroPrimaryCta: z.string().min(1, { error: "Required." }),
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
  heroImage: z.string().optional(),
  eyebrow: z.string().min(1, { error: "Required." }),
  title: z.string().min(1, { error: "Required." }),
  lede: z.string().min(1, { error: "Required." }),
  sections: z.array(SiteContentSectionInputSchema).min(1, { error: "Add at least one section." }),
});

export const SiteContentSimplePageInputSchema = z.object({
  heroImage: z.string().optional(),
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
  heroImage: z.string().optional(),
  title: z.string().min(1, { error: "Required." }),
  lede: z.string().optional(),
  items: z.array(SiteContentFaqItemInputSchema).min(1, { error: "Add at least one question." }),
});

export const SiteContentContactInputSchema = z.object({
  heroImage: z.string().optional(),
  title: z.string().min(1, { error: "Required." }),
  lede: z.string().min(1, { error: "Required." }),
});

/** Builds the schema for a CopyContentForm page from its field list. A mistyped {placeholder} is rejected here because visitors would otherwise see it literally. */
export function copyInputSchema(sections: CopySection[]) {
  const shape: Record<string, z.ZodType<string | undefined>> = {};
  for (const field of sections.flatMap((section) => section.fields)) {
    if (field.image) {
      shape[field.key] = z.string().optional();
      continue;
    }
    const allowed = field.placeholders ?? [];
    const base = field.optional ? z.string().trim() : z.string().trim().min(1, { error: "Required." });
    shape[field.key] = base.refine(
      (value) => placeholdersIn(value).every((name) => allowed.includes(name)),
      {
        error: allowed.length
          ? `Only ${allowed.map((name) => `{${name}}`).join(", ")} can be used in curly brackets here.`
          : "Curly brackets can't be used in this field.",
      }
    );
  }
  return z.object(shape);
}

export const SiteContentLegalInputSchema = z.object({
  heroImage: z.string().optional(),
  title: z.string().min(1, { error: "Required." }),
  body: z.string().min(1, { error: "Required." }),
});
