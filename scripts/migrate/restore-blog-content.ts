import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import sharp from "sharp";
import legacyRedirects from "../../lib/data/legacyRedirects.json";
import { isHtmlBody } from "../../lib/blogBody";
import { sanitizeBlogHtml } from "../../lib/blogBodySanitize";
import { storageDownloadUrl } from "../../lib/media/assets";
import type { BlogPost } from "../../lib/types";

/**
 * One-time fix: scripts/migrate-legacy-blog.ts flattened the WordPress post
 * HTML to plain text — headings, bold, lists, links and in-text images were
 * lost. This re-reads the posts from the old site (now old.keshertours.com)
 * and stores each body as rich HTML, the format the admin editor writes.
 *
 *  - Only posts whose body is still exactly the migrated plain text are
 *    touched. A post edited since (in the old textarea or the new editor)
 *    is skipped and listed, so no staff edit is overwritten.
 *  - Links to the old site are rewritten to new-site paths: old blog posts
 *    lived at the root (/jewish-senior-travel/) and now live under /blog/;
 *    everything else goes through the legacy redirect map next.config.ts
 *    uses. Every internal target is checked against the live site.
 *  - Images are copied off the old site into our Storage bucket
 *    (blog/legacy/<slug>/…), since old.keshertours.com will be shut down.
 *    WordPress thumbnails (-300x188) are swapped for the original; anything
 *    over 2000px is shrunk to 2000px WebP, like admin uploads.
 *  - The result is run through the same sanitizer as admin saves.
 *
 * Dry run by default: checks every image and link, writes
 * scripts/migrate/output/blog-restore-preview.json and one HTML file per
 * post under scripts/migrate/output/blog-restore/ to open in a browser.
 * --commit uploads the images and writes Firestore. Afterwards run
 * scripts/migrate/index-media-library.ts so the image library lists them.
 *
 * --create-missing also creates posts that exist on the old site but were
 * never imported (they were published there after the original import),
 * with their featured image as hero, tags and original publish date.
 *
 * Run with (react-server condition lets the server-only sanitizer load):
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/migrate/restore-blog-content.ts [--commit] [--only=slug]
 */

const COMMIT = process.argv.includes("--commit");
// Also create posts that exist on the old site but were never imported
// (published there after the September import), with hero image, tags and date.
const CREATE_MISSING = process.argv.includes("--create-missing");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const UA = "Mozilla/5.0 (compatible; KeshertoursMigration/1.0)";
const WP_BASE = "https://old.keshertours.com/wp-json/wp/v2";
const LIVE_SITE = "https://keshertours.com";
const OUR_HOSTS = new Set(["keshertours.com", "www.keshertours.com", "old.keshertours.com"]);
const MAX_EDGE = 2000;

interface WpPost {
  slug: string;
  content: { rendered: string };
}

interface WpPostFull extends WpPost {
  date: string;
  title: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: { source_url: string }[];
    "wp:term"?: { taxonomy: string; name: string }[][];
  };
}

async function fetchPostFull(slug: string): Promise<WpPostFull> {
  const res = await fetch(`${WP_BASE}/posts?slug=${encodeURIComponent(slug)}&_embed=1`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`WP post fetch failed (${res.status}): ${slug}`);
  const [post] = (await res.json()) as WpPostFull[];
  if (!post) throw new Error(`WP post not found: ${slug}`);
  return post;
}

// --- must match scripts/migrate-legacy-blog.ts, to recognise untouched bodies ---
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
// ---

const redirectMap = new Map(legacyRedirects.map((r) => [r.source.toLowerCase(), r.destination]));

/** Old-site URL → new-site path; other sites' URLs unchanged; undefined = drop the link. */
function mapHref(raw: string, blogSlugs: Set<string>): string | undefined {
  let href = raw.trim();
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return href.startsWith("mailto:") ? href : undefined;
  let url: URL;
  try {
    url = new URL(href, "https://keshertours.com/");
  } catch {
    return undefined;
  }
  // A few posts link through a google.com/search?q=<our url> wrapper.
  if (url.hostname.endsWith("google.com") && url.pathname === "/search") {
    const q = url.searchParams.get("q");
    if (q && /^https?:\/\//.test(q)) {
      href = q;
      url = new URL(href);
    }
  }
  if (!/^https?:$/.test(url.protocol)) return undefined;
  if (!OUR_HOSTS.has(url.hostname)) return url.toString();

  const path = decodeURIComponent(url.pathname)
    .split("/")
    .map((seg) => seg.trim().replace(/\s+/g, "-"))
    .join("/")
    .toLowerCase()
    .replace(/\/+$/, "");
  if (!path) return "/";
  const redirected = redirectMap.get(path) ?? redirectMap.get(encodeURI(path).toLowerCase());
  if (redirected) return redirected;
  // Old blog posts lived at the site root; they're under /blog/ now.
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 1 && blogSlugs.has(sanitizeSlug(segments[0]))) return `/blog/${sanitizeSlug(segments[0])}`;
  return path + url.search + url.hash;
}

/** WordPress thumbnail (foo-300x188.jpg) → the original upload (foo.jpg). */
function originalImageCandidates(src: string): string[] {
  const original = src.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, "$1");
  return original !== src ? [original, src] : [src];
}

async function fetchAllPosts(): Promise<WpPost[]> {
  const posts: WpPost[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${WP_BASE}/posts?per_page=50&page=${page}&_fields=slug,content`, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) {
      if (res.status === 400) break;
      throw new Error(`WP posts fetch failed: ${res.status}`);
    }
    const batch = (await res.json()) as WpPost[];
    posts.push(...batch);
    if (batch.length < 50) break;
  }
  return posts;
}

async function urlOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
    return res.ok && (res.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

async function pageStatus(path: string): Promise<number> {
  try {
    const res = await fetch(LIVE_SITE + path, { redirect: "follow", headers: { "User-Agent": UA } });
    return res.status;
  } catch {
    return 0;
  }
}

/** Per source image: which URL to copy (original if it exists), checked once. */
const resolvedSource = new Map<string, string | null>();
async function resolveImage(src: string): Promise<string | null> {
  if (resolvedSource.has(src)) return resolvedSource.get(src)!;
  let found: string | null = null;
  for (const candidate of originalImageCandidates(src)) {
    if (await urlOk(candidate)) {
      found = candidate;
      break;
    }
  }
  resolvedSource.set(src, found);
  return found;
}

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Missing Firebase Admin credentials in .env.local.");
  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  });
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket();

  console.log(`Mode: ${COMMIT ? "COMMIT (uploading images + writing Firestore)" : "DRY RUN (no writes)"}`);

  const snap = await db.collection("blogPosts").get();
  const firestorePosts = new Map(snap.docs.map((d) => [(d.data() as BlogPost).slug, { id: d.id, post: d.data() as BlogPost }]));
  const allWpPosts = await fetchAllPosts();
  const blogSlugs = new Set(firestorePosts.keys());
  // Posts about to be created are valid /blog/ link targets too.
  if (CREATE_MISSING) for (const p of allWpPosts) blogSlugs.add(sanitizeSlug(p.slug));
  const wpPosts = allWpPosts.filter((p) => !ONLY || sanitizeSlug(p.slug) === ONLY);
  console.log(`Old site: ${wpPosts.length} posts. Firestore: ${firestorePosts.size} posts.`);

  const notInFirestore: string[] = [];
  const skippedEdited: string[] = [];
  const skippedAlreadyRich: string[] = [];
  const missingImages: { post: string; src: string }[] = [];
  const droppedLinks: { post: string; href: string }[] = [];
  const internalTargets = new Map<string, Set<string>>();
  const plans: {
    slug: string;
    docId: string;
    html: string;
    images: string[];
    links: number;
    /** Set for a post the import missed: written as a new doc. */
    create?: { title: string; publishedAt: string; tags: string[]; heroSource?: string };
  }[] = [];

  for (const wp of wpPosts) {
    const slug = sanitizeSlug(wp.slug);
    const entry = firestorePosts.get(slug);
    let create: (typeof plans)[number]["create"];
    if (!entry) {
      notInFirestore.push(slug);
      if (!CREATE_MISSING) continue;
      const full = await fetchPostFull(wp.slug);
      create = {
        title: decodeEntities(full.title.rendered.replace(/<[^>]+>/g, "").trim()),
        publishedAt: full.date,
        tags: full._embedded?.["wp:term"]?.flat().filter((t) => t.taxonomy === "post_tag").map((t) => t.name) ?? [],
        heroSource: full._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
      };
    } else {
      if (isHtmlBody(entry.post.body)) {
        skippedAlreadyRich.push(slug);
        continue;
      }
      // WordPress rewrote its own domain to old.keshertours.com after the
      // migration ran, including in visible text — undo that to compare.
      const asMigrated = wp.content.rendered.replace(/old\.keshertours\.com/g, "keshertours.com");
      if (htmlToPlainText(asMigrated) !== entry.post.body) {
        skippedEdited.push(slug);
        continue;
      }
    }

    const $ = cheerio.load(wp.content.rendered);
    $("script, style, noscript, iframe").remove();

    let links = 0;
    $("a[href]").each((_, el) => {
      const a = $(el);
      const mapped = mapHref(a.attr("href") ?? "", blogSlugs);
      if (!mapped) {
        droppedLinks.push({ post: slug, href: a.attr("href") ?? "" });
        a.replaceWith(a.contents());
        return;
      }
      a.attr("href", mapped);
      links++;
      if (mapped.startsWith("/")) {
        internalTargets.set(mapped, (internalTargets.get(mapped) ?? new Set()).add(slug));
      }
    });

    const images: string[] = [];
    for (const el of $("img").toArray()) {
      const img = $(el);
      const src = img.attr("src") ?? "";
      const source = /^https?:\/\//.test(src) ? await resolveImage(src) : null;
      if (!source) {
        missingImages.push({ post: slug, src });
        img.remove();
        continue;
      }
      images.push(source);
      // Placeholder until --commit uploads it; the dry run previews the old-site copy.
      img.attr("src", source);
    }

    // Visible text that spells out an old-site address.
    let html = $("body").html() ?? "";
    // (image srcs keep the old host until --commit swaps them for our copies).
    html = sanitizeBlogHtml(html)
      .replace(/old\.keshertours\.com(?!\/wp-content\/)/g, "keshertours.com")
      .replace(/<p>(\s|&nbsp;|<br \/>)*<\/p>/g, "");
    plans.push({ slug, docId: entry?.id ?? slug, html, images, links, create });
  }

  console.log(`\nChecking ${internalTargets.size} internal link targets on ${LIVE_SITE}…`);
  const brokenLinks: { path: string; status: number; posts: string[] }[] = [];
  for (const [path, posts] of internalTargets) {
    const status = await pageStatus(path);
    if (status !== 200) brokenLinks.push({ path, status, posts: [...posts] });
  }

  if (COMMIT) {
    const uploaded = new Map<string, string>(); // old-site source URL → our bucket URL
    const copyImage = async (source: string, slug: string): Promise<string> => {
      const done = uploaded.get(source);
      if (done) return done;
      const res = await fetch(source, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`Image download failed (${res.status}): ${source}`);
      let buffer: Buffer = Buffer.from(await res.arrayBuffer());
      let contentType = res.headers.get("content-type") || "image/jpeg";
      let ext = (source.match(/\.([a-z0-9]+)$/i)?.[1] ?? "jpg").toLowerCase();
      if (contentType !== "image/gif") {
        const meta = await sharp(buffer).metadata();
        if (Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_EDGE) {
          buffer = await sharp(buffer)
            .rotate()
            .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside" })
            .webp({ quality: 85 })
            .toBuffer();
          contentType = "image/webp";
          ext = "webp";
        }
      }
      const path = `blog/legacy/${slug}/${randomUUID()}.${ext}`;
      const token = randomUUID();
      await bucket.file(path).save(buffer, {
        contentType,
        metadata: { metadata: { firebaseStorageDownloadTokens: token } },
      });
      const url = storageDownloadUrl(bucket.name, path, token);
      uploaded.set(source, url);
      return url;
    };
    for (const plan of plans) {
      for (const source of plan.images) await copyImage(source, plan.slug);
      let html = plan.html;
      for (const source of new Set(plan.images)) {
        html = html.split(`src="${source.replace(/&/g, "&amp;")}"`).join(`src="${uploaded.get(source)}"`);
        html = html.split(`src="${source}"`).join(`src="${uploaded.get(source)}"`);
      }
      if (/old\.keshertours\.com|src="https:\/\/keshertours\.com\/wp-content/.test(html)) {
        throw new Error(`Unreplaced old-site image left in ${plan.slug} — aborting before writing it.`);
      }
      if (plan.create) {
        const ref = db.collection("blogPosts").doc(plan.docId);
        if ((await ref.get()).exists) throw new Error(`Refusing to overwrite existing doc ${plan.docId}.`);
        const post: BlogPost = {
          postId: plan.docId,
          slug: plan.slug,
          title: plan.create.title,
          body: html,
          tags: plan.create.tags,
          status: "published",
          publishedAt: plan.create.publishedAt,
        };
        if (plan.create.heroSource) post.heroImage = await copyImage(plan.create.heroSource, plan.slug);
        await ref.set(JSON.parse(JSON.stringify(post)));
        console.log(`Created ${plan.slug}: ${plan.links} links, ${plan.images.length} images, hero ${post.heroImage ? "yes" : "no"}.`);
      } else {
        await db.collection("blogPosts").doc(plan.docId).update({ body: html });
        console.log(`Updated ${plan.slug}: ${plan.links} links, ${plan.images.length} images.`);
      }
    }
    console.log(`Uploaded ${uploaded.size} images.`);
  }

  mkdirSync("scripts/migrate/output/blog-restore", { recursive: true });
  for (const plan of plans) {
    writeFileSync(
      `scripts/migrate/output/blog-restore/${plan.slug}.html`,
      `<!doctype html><meta charset="utf-8"><title>${plan.slug}</title>` +
        `<style>body{font:16px/1.7 system-ui;max-width:760px;margin:40px auto;padding:0 16px}img{max-width:100%;height:auto;display:block;margin:16px auto;border-radius:12px}a{color:#0369a1}</style>` +
        plan.html,
      "utf-8"
    );
  }
  writeFileSync(
    "scripts/migrate/output/blog-restore-preview.json",
    JSON.stringify({ skippedEdited, skippedAlreadyRich, notInFirestore, missingImages, droppedLinks, brokenLinks, plans }, null, 2),
    "utf-8"
  );

  const totalImages = plans.reduce((n, p) => n + p.images.length, 0);
  const uniqueImages = new Set(plans.flatMap((p) => p.images)).size;
  const upgraded = [...resolvedSource].filter(([src, found]) => found && found !== src).length;
  console.log("\n=== SUMMARY ===");
  console.log(`Posts ${COMMIT ? "restored" : "to restore"}: ${plans.length}`);
  console.log(`Links: ${plans.reduce((n, p) => n + p.links, 0)} (dropped as unusable: ${droppedLinks.length})`);
  console.log(`Images: ${totalImages} placements, ${uniqueImages} unique files (${upgraded} thumbnails swapped for the original)`);
  console.log(`Images missing on the old site (left out): ${missingImages.length}`);
  for (const m of missingImages) console.log(`  ${m.post}: ${m.src}`);
  console.log(`Internal link targets not returning 200: ${brokenLinks.length}`);
  for (const b of brokenLinks) console.log(`  ${b.status} ${b.path}  (in ${b.posts.join(", ")})`);
  console.log(`Skipped — edited since migration: ${skippedEdited.length}${skippedEdited.length ? " — " + skippedEdited.join(", ") : ""}`);
  console.log(`Skipped — already saved in the new editor: ${skippedAlreadyRich.length}${skippedAlreadyRich.length ? " — " + skippedAlreadyRich.join(", ") : ""}`);
  console.log(`Old-site posts not on the new site: ${notInFirestore.length}${notInFirestore.length ? " — " + notInFirestore.join(", ") : ""}`);
  console.log("Preview: scripts/migrate/output/blog-restore/<slug>.html and blog-restore-preview.json");
  if (!COMMIT) console.log("Dry run only — re-run with --commit to write. Then run scripts/migrate/index-media-library.ts.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
