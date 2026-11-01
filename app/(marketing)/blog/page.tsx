import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import BlogCard from "@/components/marketing/BlogCard";
import { getPublishedBlogPosts } from "@/lib/data/blog";
import { getSiteContent } from "@/lib/data/siteContent";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteContent("blog");
  return {
    title: "Blog",
    description: copy.metaDescription,
    alternates: { canonical: "/blog" },
  };
}

export default async function BlogIndexPage() {
  const [posts, copy] = await Promise.all([getPublishedBlogPosts(), getSiteContent("blog")]);

  return (
    <div>
      <PageHeader
        eyebrow={copy.eyebrow || undefined}
        title={copy.title}
        lede={copy.lede || undefined}
      />

      {posts.length === 0 ? (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg leading-8 text-[var(--color-slate)]">
            {copy.emptyMessage}
          </p>
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {posts.map((post) => (
            <BlogCard key={post.postId} post={post} readMoreLabel={copy.readMore} />
          ))}
        </div>
      )}
    </div>
  );
}
