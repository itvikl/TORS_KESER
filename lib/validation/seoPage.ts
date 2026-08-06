import * as z from "zod";

/** Mirrors lib/types.ts SeoLandingPage, minus pageId (assigned by the data layer). */
export const SeoPageInputSchema = z.object({
  slug: z
    .string()
    .min(1, { error: "Slug is required." })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: "Slug must be lowercase, hyphen-separated (e.g. kosher-tour-to-italy).",
    }),
  title: z.string().min(1, { error: "Title is required." }),
  body: z.string().min(1, { error: "Body is required." }),
  tourIds: z.array(z.string()),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

export type SeoPageInput = z.infer<typeof SeoPageInputSchema>;
