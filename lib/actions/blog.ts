"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { BlogPostInputSchema } from "@/lib/validation/blogPost";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import { createBlogPostDoc, isBlogSlugTaken, updateBlogPostDoc } from "@/lib/data/admin/blog";

export type SaveBlogPostResult =
  | { ok: true; postId: string }
  | { ok: false; errors: Record<string, string[] | undefined> };

export async function saveBlogPost(input: unknown, postId?: string): Promise<SaveBlogPostResult> {
  await requireAdminSession();

  const parsed = BlogPostInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }
  const data = parsed.data;

  if (await isBlogSlugTaken(data.slug, postId)) {
    return { ok: false, errors: { slug: ["This slug is already used by another post."] } };
  }

  const savedId = postId ? await updateBlogPostDoc(postId, data) : await createBlogPostDoc(data);

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${savedId}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  revalidatePath("/"); // homepage's "latest posts" section reads the same collection

  return { ok: true, postId: savedId };
}
