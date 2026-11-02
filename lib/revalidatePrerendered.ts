import "server-only";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { getPublishedBlogPosts } from "@/lib/data/blog";

/**
 * revalidatePath("/tours/[slug]", "page") silently does nothing for pages
 * prerendered by generateStaticParams — checked against `next start` on
 * Next 16.3.8: the cached copy stays a HIT, while revalidatePath of the
 * literal URL turns the next request into a MISS. So changes that affect
 * every tour or blog page refresh each one by its own URL.
 */
export async function revalidateAllTourPages(): Promise<void> {
  // Every status, and old slugs too: archived tours and old URLs redirect, and their cached copies need dropping as well.
  const snapshot = await adminDb().collection("tours").select("slug", "slugHistory").get();
  const slugs = new Set<string>();
  for (const doc of snapshot.docs) {
    const { slug, slugHistory } = doc.data() as { slug?: string; slugHistory?: string[] };
    if (slug) slugs.add(slug);
    for (const old of slugHistory ?? []) slugs.add(old);
  }
  for (const slug of slugs) revalidatePath(`/tours/${slug}`);
}

export async function revalidateAllBlogPostPages(): Promise<void> {
  for (const post of await getPublishedBlogPosts()) revalidatePath(`/blog/${post.slug}`);
}
