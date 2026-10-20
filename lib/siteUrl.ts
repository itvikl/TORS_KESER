/**
 * The site's public origin (no trailing slash) — the base for canonical URLs,
 * the sitemap and Open Graph links. Set NEXT_PUBLIC_SITE_URL to the real
 * domain at launch (apphosting.yaml); every other host serving the app (e.g.
 * the *.hosted.app URL) then gets robots.txt "Disallow: /" — see app/robots.ts.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
