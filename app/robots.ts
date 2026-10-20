import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Once NEXT_PUBLIC_SITE_URL is the real domain, the same app still answers on
 * its *.hosted.app backend URL — block crawling there so it can't compete
 * with the real domain as duplicate content. Matched narrowly on purpose: a
 * proxy-rewritten Host header must never make the real domain uncrawlable.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const siteHost = new URL(SITE_URL).host;
  if (host.endsWith(".hosted.app") && !siteHost.endsWith(".hosted.app")) {
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
