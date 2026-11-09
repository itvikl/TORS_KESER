import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostView from "@/components/marketing/BlogPostView";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/data/blog";
import { getSiteContent } from "@/lib/data/siteContent";
import { withoutBrandSuffix } from "@/lib/seoTitle";
import { bodyToPlainText } from "@/lib/blogBody";
import { renderBlogBody } from "@/lib/blogBodySanitize";

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

  const title = withoutBrandSuffix(post.seoTitle ?? post.title);
  const description = post.seoDescription ?? bodyToPlainText(post.body).slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      images: post.heroImage ? [post.heroImage] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();
  const copy = await getSiteContent("blog");

  return <BlogPostView post={post} bodyHtml={renderBlogBody(post.body)} backLabel={copy.backLink} />;
}
