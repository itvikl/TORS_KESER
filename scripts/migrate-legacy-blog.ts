import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import type { BlogPost } from "../lib/types";

/**
 * One-time migration of the old keshertours.com WordPress blog (~58 posts,
 * category "blog") into the "blogPosts" Firestore collection, via the
 * public WP REST API (wp-json/wp/v2/posts) — no admin credentials needed,
 * the old site is still live and the API is public.
 *
 * Skips any slug that already exists (safe to re-run). Every migrated
 * post is written as status "published" with its original publishedAt
 * date preserved, since the client wants these live again once the
 * public /blog/[slug] route exists (see the readiness plan).
 *
 * Defaults to a dry run (writes scripts/migrate/output/blog-preview.json,
 * touches nothing else). Pass --commit to actually write to Firestore/
 * Storage. Pass --limit=N to test on a subset.
 *
 * Run with: npx tsx scripts/migrate-legacy-blog.ts [--commit] [--limit=N]
 */

const COMMIT = process.argv.includes("--commit");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : undefined;

const UA = "Mozilla/5.0 (compatible; KeshertoursMigration/1.0)";
const WP_BASE = "https://keshertours.com/wp-json/wp/v2";

interface WpPost {
  slug: string;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: { source_url: string }[];
    "wp:term"?: { taxonomy: string; name: string }[][];
  };
}

function decodeEntities(html: string): string {
  return html
    .replace(/&#8217;|&#039;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, "&");
}

/** content.rendered is real HTML (WP block editor output) — the admin body field is a plain <textarea>, so flatten to text, keeping paragraph breaks. */
function htmlToPlainText(html: string): string {
  const $ = cheerio.load(html);
  const paragraphs: string[] = [];
  $("p, li, h2, h3, h4").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) paragraphs.push(text);
  });
  const joined = paragraphs.length > 0 ? paragraphs.join("\n\n") : $.root().text().replace(/\s+/g, " ").trim();
  return decodeEntities(joined);
}

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchAllPosts(): Promise<WpPost[]> {
  const posts: WpPost[] = [];
  let page = 1;
  for (;;) {
    const res = await fetch(`${WP_BASE}/posts?per_page=50&page=${page}&_embed=1`, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) {
      if (res.status === 400) break; // WP returns 400 "rest_post_invalid_page_number" past the last page
      throw new Error(`WP posts fetch failed: ${res.status}`);
    }
    const batch = (await res.json()) as WpPost[];
    if (batch.length === 0) break;
    posts.push(...batch);
    if (batch.length < 50) break;
    page++;
  }
  return posts;
}

async function uploadImageFromUrl(
  storage: ReturnType<typeof getStorage>,
  sourceUrl: string,
  slug: string
): Promise<string | undefined> {
  try {
    const res = await fetch(sourceUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) return undefined;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const extMatch = sourceUrl.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const path = `blog/legacy/${slug}/${randomUUID()}.${ext}`;
    const downloadToken = randomUUID();
    const bucket = storage.bucket();
    const blob = bucket.file(path);
    await blob.save(buffer, {
      contentType,
      metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } },
    });
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
  } catch {
    return undefined;
  }
}

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in .env.local.");
  }
  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  });
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  const storage = getStorage(app);

  console.log(`Mode: ${COMMIT ? "COMMIT (writing to Firestore + Storage)" : "DRY RUN (no writes)"}`);

  const existingSnap = await db.collection("blogPosts").get();
  const existingSlugs = new Set(existingSnap.docs.map((d) => (d.data() as BlogPost).slug));
  console.log(`Existing blog posts in Firestore: ${existingSlugs.size}`);

  const allPosts = await fetchAllPosts();
  console.log(`Found ${allPosts.length} posts on the old site.`);
  const source = allPosts.slice(0, LIMIT);

  const results: { post: BlogPost; heroImageSourceUrl?: string }[] = [];
  const skipped: string[] = [];

  for (const wp of source) {
    const slug = sanitizeSlug(wp.slug);
    if (existingSlugs.has(slug)) {
      skipped.push(slug);
      continue;
    }
    const title = decodeEntities(wp.title.rendered.replace(/<[^>]+>/g, "").trim());
    const body = htmlToPlainText(wp.content.rendered);
    const heroImageSourceUrl = wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    const tagTerms =
      wp._embedded?.["wp:term"]?.flat().filter((t) => t.taxonomy === "post_tag").map((t) => t.name) ?? [];

    const post: BlogPost = {
      postId: slug,
      slug,
      title,
      body,
      tags: tagTerms,
      status: "published",
      publishedAt: wp.date,
    };
    results.push({ post, heroImageSourceUrl });
    console.log(`Parsed "${title}" (${slug})`);
  }

  if (COMMIT) {
    for (const r of results) {
      if (r.heroImageSourceUrl) {
        const uploaded = await uploadImageFromUrl(storage, r.heroImageSourceUrl, r.post.slug);
        if (uploaded) r.post.heroImage = uploaded;
      }
      await db.collection("blogPosts").doc(r.post.slug).set(r.post);
      console.log(`Committed "${r.post.title}" (${r.post.slug})${r.post.heroImage ? " with hero image" : ""}.`);
    }
  }

  mkdirSync("scripts/migrate/output", { recursive: true });
  writeFileSync("scripts/migrate/output/blog-preview.json", JSON.stringify(results, null, 2), "utf-8");

  console.log("\n=== SUMMARY ===");
  console.log(`Skipped (already exist): ${skipped.length}${skipped.length ? " — " + skipped.join(", ") : ""}`);
  console.log(`${COMMIT ? "Committed" : "Would create"} as published: ${results.length}`);
  console.log(`Full preview written to scripts/migrate/output/blog-preview.json`);
  if (!COMMIT) console.log("Dry run only — re-run with --commit to write.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
