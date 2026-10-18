import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostEditorForm from "@/components/admin/BlogPostEditorForm";
import { getBlogPostByIdAdmin } from "@/lib/data/admin/blog";
import { getAdminSession } from "@/lib/auth/dal";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteBlogPost } from "@/lib/actions/deletions";

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
  const isAdmin = (await getAdminSession())?.role === "admin";

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <DeleteButton action={deleteBlogPost.bind(null, postId)} what="this blog post" redirectTo="/admin/blog" />
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{post.title}</h1>
      </div>
      <BlogPostEditorForm mode="edit" postId={postId} initialPost={post} />
    </div>
  );
}
