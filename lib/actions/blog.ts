"use server";

import { revalidatePath } from "next/cache";
import { syncContentMediaSafely } from "@/lib/data/admin/mediaLibrary";
import { requireContentSession } from "@/lib/auth/dal";
import { BlogPostInputSchema } from "@/lib/validation/blogPost";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import { renderBlogBody, sanitizeBlogHtml } from "@/lib/blogBodySanitize";
import { bodyToPlainText, isHtmlBody } from "@/lib/blogBody";
import { createBlogPostDoc, getAllBlogPostsAdmin, isBlogSlugTaken, updateBlogPostDoc } from "@/lib/data/admin/blog";

export type SaveBlogPostResult =
  | { ok: true; postId: string }
  | { ok: false; errors: Record<string, string[] | undefined> };

export async function saveBlogPost(input: unknown, postId?: string): Promise<SaveBlogPostResult> {
  await requireContentSession();

  const parsed = BlogPostInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }
  const data = parsed.data;
  if (isHtmlBody(data.body)) data.body = sanitizeBlogHtml(data.body);
  if (!bodyToPlainText(data.body) && !/<img/i.test(data.body)) {
    return { ok: false, errors: { body: ["Body is required."] } };
  }

  if (await isBlogSlugTaken(data.slug, postId)) {
    return { ok: false, errors: { slug: ["This slug is already used by another post."] } };
  }

  const savedId = postId ? await updateBlogPostDoc(postId, data) : await createBlogPostDoc(data);
  await syncContentMediaSafely("blogPosts", savedId);

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${savedId}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  revalidatePath("/"); // homepage's "latest posts" section reads the same collection

  return { ok: true, postId: savedId };
}

/** The editor's Preview — the body exactly as the public page would render it. */
export async function previewBlogBody(body: string): Promise<string> {
  await requireContentSession();
  return renderBlogBody(body);
}

export type BlogLinkTarget = { title: string; href: string; publishedAt?: string };

/** Published posts for the editor's "link to another post" list, newest first. */
export async function listBlogLinkTargets(): Promise<BlogLinkTarget[]> {
  await requireContentSession();
  const posts = await getAllBlogPostsAdmin();
  return posts
    .filter((p) => p.status === "published")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .map((p) => ({ title: p.title, href: `/blog/${p.slug}`, publishedAt: p.publishedAt }));
}
