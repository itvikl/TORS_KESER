import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SafeImage from "@/components/ui/SafeImage";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/data/blog";

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.body.slice(0, 160),
  };
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <div>
      <div className="border-b border-[var(--color-border-ice)] bg-[var(--color-glacier-elevated)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/blog"
            className="text-sm font-semibold text-[var(--color-ice)] transition-colors hover:brightness-110"
          >
            ← All posts
          </Link>
          {post.publishedAt && (
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-slate)]">
              {formatDate(post.publishedAt)}
            </p>
          )}
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--color-mist)] sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          {post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--color-border-ice)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-slate)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {post.heroImage && (
        <div className="mx-auto -mt-1 max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="relative h-72 overflow-hidden rounded-3xl shadow-2xl sm:h-96">
            <SafeImage src={post.heroImage} alt={post.title} sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          <p className="whitespace-pre-line text-[15px] leading-7 text-[var(--color-mist)]">{post.body}</p>
        </div>
      </div>
    </div>
  );
}
