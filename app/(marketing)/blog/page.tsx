import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import BlogCard from "@/components/marketing/BlogCard";
import { getPublishedBlogPosts } from "@/lib/data/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Destination guides, kashrut logistics, and trip planning from the Keshertours team.",
};

export default async function BlogIndexPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div>
      <PageHeader
        eyebrow="The Journal"
        title="Stories from the Road"
        lede="Destination guides, kashrut logistics and trip planning — written by the same team that runs the tours."
      />

      {posts.length === 0 ? (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg leading-8 text-[var(--color-slate)]">
            No posts published yet — publish one from /admin/blog to have it appear here.
          </p>
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {posts.map((post) => (
            <BlogCard key={post.postId} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
