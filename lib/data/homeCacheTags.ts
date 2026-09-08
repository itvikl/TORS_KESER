/**
 * Cache tags shared between the home page's `unstable_cache` wrapper
 * (app/(marketing)/page.tsx) and the admin actions that must invalidate it
 * via `revalidateTag` after a write. Centralized so the tag string can't
 * drift out of sync between the two sides.
 */
export const HOME_TOURS_CACHE_TAG = "home-tours";
export const HOME_CONTENT_CACHE_TAG = "home-content";
export const HOME_BLOG_CACHE_TAG = "home-blog";
