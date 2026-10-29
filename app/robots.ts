import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * The *.hosted.app backend URL and the staging.* subdomain are never the
 * public site: before launch they are the staging copy, and after launch they
 * would compete with the real domain as duplicate content — block crawling
 * there either way. Matched narrowly on purpose: a proxy-rewritten Host header
 * must never make the real domain uncrawlable.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  if (host.endsWith(".hosted.app") || host.startsWith("staging.")) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Back-office, APIs, and per-customer transactional pages.
      disallow: ["/admin", "/api/", "/pay/", "/tours/*/book"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
