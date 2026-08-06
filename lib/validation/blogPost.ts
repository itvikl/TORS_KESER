import * as z from "zod";

/** Mirrors lib/types.ts BlogPost, minus postId (assigned by the data layer). */
export const BlogPostInputSchema = z.object({
  slug: z
    .string()
    .min(1, { error: "Slug is required." })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: "Slug must be lowercase, hyphen-separated (e.g. kosher-passover-tips).",
    }),
  title: z.string().min(1, { error: "Title is required." }),
  body: z.string().min(1, { error: "Body is required." }),
  heroImage: z.string().optional(),
  tags: z.array(z.string()),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type BlogPostInput = z.infer<typeof BlogPostInputSchema>;
