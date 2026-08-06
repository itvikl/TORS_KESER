import type { Metadata } from "next";
import BlogPostEditorForm from "@/components/admin/BlogPostEditorForm";

export const metadata: Metadata = { title: "New post" };

export default function NewBlogPostPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">New post</h1>
      </div>
      <BlogPostEditorForm mode="create" />
    </div>
  );
}
