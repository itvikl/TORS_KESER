import "server-only";
import type { BlogPost } from "@/lib/types";
import type { BlogPostInput } from "@/lib/validation/blogPost";
import { adminDb } from "@/lib/firebase/admin";

const BLOG_COLLECTION = "blogPosts";

export async function getAllBlogPostsAdmin(): Promise<BlogPost[]> {
  const snapshot = await adminDb().collection(BLOG_COLLECTION).get();
  return snapshot.docs.map((doc) => doc.data() as BlogPost);
}

export async function getBlogPostByIdAdmin(postId: string): Promise<BlogPost | null> {
  const doc = await adminDb().collection(BLOG_COLLECTION).doc(postId).get();
  return doc.exists ? (doc.data() as BlogPost) : null;
}

export async function isBlogSlugTaken(slug: string, excludePostId?: string): Promise<boolean> {
  const snapshot = await adminDb().collection(BLOG_COLLECTION).where("slug", "==", slug).get();
  return snapshot.docs.some((doc) => doc.id !== excludePostId);
}

export async function createBlogPostDoc(input: BlogPostInput): Promise<string> {
  const ref = adminDb().collection(BLOG_COLLECTION).doc();
  const post: BlogPost = { ...input, postId: ref.id };
  await ref.set(post);
  return ref.id;
}

export async function updateBlogPostDoc(postId: string, input: BlogPostInput): Promise<string> {
  const ref = adminDb().collection(BLOG_COLLECTION).doc(postId);
  const post: BlogPost = { ...input, postId };
  await ref.set(post);
  return postId;
}
