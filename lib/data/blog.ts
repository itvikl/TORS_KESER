import "server-only";
import type { BlogPost } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Public counterpart of lib/data/admin/blog.ts — published-only reads for
 * the public /blog pages, same split as lib/data/tours.ts vs
 * lib/data/admin/tours.ts and lib/data/reviews.ts vs lib/data/admin/reviews.ts.
 */
const BLOG_COLLECTION = "blogPosts";

function byPublishedAtDesc(a: BlogPost, b: BlogPost): number {
  return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const snapshot = await adminDb().collection(BLOG_COLLECTION).where("status", "==", "published").get();
  return snapshot.docs.map((doc) => doc.data() as BlogPost).sort(byPublishedAtDesc);
}

export async function getLatestBlogPosts(limit: number): Promise<BlogPost[]> {
  const posts = await getPublishedBlogPosts();
  return posts.slice(0, limit);
}

/** Draft posts are excluded (reachable by staff via /admin/blog only) — same policy as getTourBySlug. */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const snapshot = await adminDb().collection(BLOG_COLLECTION).where("slug", "==", slug).limit(1).get();
  const doc = snapshot.docs[0];
  if (!doc) return null;
  const post = doc.data() as BlogPost;
  return post.status === "published" ? post : null;
}
