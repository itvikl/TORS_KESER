import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostEditorForm from "@/components/admin/BlogPostEditorForm";
import { getBlogPostByIdAdmin } from "@/lib/data/admin/blog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const post = await getBlogPostByIdAdmin(postId);
  return { title: post ? `Edit — ${post.title}` : "Post" };
}

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await getBlogPostByIdAdmin(postId);
  if (!post) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{post.title}</h1>
      </div>
      <BlogPostEditorForm mode="edit" postId={postId} initialPost={post} />
    </div>
  );
}
