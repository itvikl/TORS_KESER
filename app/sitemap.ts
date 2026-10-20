import type { MetadataRoute } from "next";
import { getAllTours } from "@/lib/data/tours";
import { getPublishedBlogPosts } from "@/lib/data/blog";
import { SITE_URL } from "@/lib/siteUrl";

// Regenerate hourly so new tours/posts show up without a redeploy.
export const revalidate = 3600;

const STATIC_PATHS = [
  "/",
  "/about",
  "/blog",
  "/contact",
  "/custom-made-tours",
  "/faq",
  "/special-offers",
  "/testimonials",
  "/legal/privacy",
  "/legal/terms-conditions",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tours, posts] = await Promise.all([getAllTours(), getPublishedBlogPosts()]);

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${SITE_URL}${path === "/" ? "" : path}`,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.5,
    })),
    ...tours.map((tour) => ({
      url: `${SITE_URL}/tours/${tour.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
