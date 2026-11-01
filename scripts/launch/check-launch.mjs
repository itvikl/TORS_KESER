#!/usr/bin/env node
/**
 * Launch readiness check — what Google and visitors will see.
 *
 *   node scripts/launch/check-launch.mjs                                  # production: https://keshertours.com
 *   node scripts/launch/check-launch.mjs https://staging.keshertours.com --staging
 *
 * Options
 *   --staging     Expect a test copy: crawling blocked, canonicals not yet on the
 *                 real domain. Those become "TODO (launch day)" instead of failures.
 *   --quick       Fewer URLs in the sitemap and old-URL sweeps.
 *   --old=N       How many of the busiest old URLs to test (default 80, --quick 25).
 *
 * Exit code 1 when any check fails. No dependencies; Node 18+.
 */
import { readFileSync, existsSync } from "node:fs";
import dns from "node:dns/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const BASE = (args.find((a) => !a.startsWith("--")) ?? "https://keshertours.com").replace(/\/+$/, "");
const STAGING = flags.has("--staging");
const QUICK = flags.has("--quick");
const OLD_COUNT = Number((args.find((a) => a.startsWith("--old=")) ?? "").split("=")[1]) || (QUICK ? 25 : 80);

const PROD_ORIGIN = "https://keshertours.com";
const HOST = new URL(BASE).host;
const AUDIT_CSV = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../docs/gsc-redirect-audit.csv");
// Search Console ownership tokens (app/layout.tsx) — losing them at launch unverifies the existing properties.
const GSC_TOKENS = ["TdFynJjeRCDciTnwEqD3BqcV90AxzX0WY062w7XMlkI", "n-i_0Ps3Ho88FTKXVUln1KLIE3U0T_ymJVR51bUZTio"];

// ---------------------------------------------------------------- reporting
const rows = [];
const ICON = { pass: "PASS", warn: "WARN", fail: "FAIL", todo: "TODO", info: "INFO" };
/** level: pass | warn | fail | todo (launch-day item; only a failure when checking production) */
function report(section, level, name, detail = "") {
  if (level === "todo" && !STAGING) level = "fail";
  rows.push({ section, level, name, detail });
}
const pass = (s, n, d) => report(s, "pass", n, d);
const check = (s, ok, n, detail = "", level = "fail") => report(s, ok ? "pass" : level, n, ok ? "" : detail);

// ---------------------------------------------------------------- http helpers
const UA = "Mozilla/5.0 (compatible; KeshertoursLaunchCheck/1.0)";
async function get(url, { redirect = "manual", timeout = 60000 } = {}) {
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect, signal: AbortSignal.timeout(timeout), headers: { "user-agent": UA } });
    const body = await res.text();
    return { ok: true, status: res.status, headers: res.headers, body, ms: Date.now() - started, url };
  } catch (error) {
    return { ok: false, status: 0, headers: new Headers(), body: "", ms: Date.now() - started, url, error: String(error.cause?.code ?? error.message) };
  }
}
/** Follow redirects by hand so every hop's status is visible. */
async function follow(url, maxHops = 6) {
  const hops = [];
  let current = url;
  for (let i = 0; i <= maxHops; i++) {
    const res = await get(current);
    if (!res.ok) return { hops, final: res, finalUrl: current };
    const location = res.headers.get("location");
    if ([301, 302, 303, 307, 308].includes(res.status) && location) {
      hops.push(res.status);
      current = new URL(location, current).toString();
      continue;
    }
    return { hops, final: res, finalUrl: current };
  }
  return { hops, final: { status: 0, body: "", ok: false, error: "too many redirects" }, finalUrl: current };
}
async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    })
  );
  return out;
}
const enc = (p) => encodeURI(decodeURI(p));
const stripSlash = (u) => u.replace(/\/+$/, "");

function parseCsv(text) {
  const rowsOut = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell.replace(/\r$/, "")); rowsOut.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rowsOut.push(row); }
  return rowsOut;
}

const head = (html) => {
  const tag = (re) => html.match(re)?.[1];
  return {
    titles: [...html.matchAll(/<title[^>]*>([^<]*)<\/title>/gi)].map((m) => m[1].replace(/&amp;/g, "&").trim()),
    description: tag(/<meta\s+name="description"\s+content="([^"]*)"/i),
    canonical: tag(/<link\s+rel="canonical"\s+href="([^"]*)"/i),
    robots: tag(/<meta\s+name="robots"\s+content="([^"]*)"/i),
    ogImage: tag(/<meta\s+property="og:image"\s+content="([^"]*)"/i)?.replace(/&amp;/g, "&"),
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]),
    h1: (html.match(/<h1[\s>]/gi) ?? []).length,
  };
};

// ---------------------------------------------------------------- 1. crawlability
async function crawlability() {
  const S = "Crawling";
  const robots = await get(`${BASE}/robots.txt`);
  if (!robots.ok || robots.status !== 200) return check(S, false, "robots.txt reachable", `status ${robots.status} ${robots.error ?? ""}`);
  const blocked = /^\s*disallow:\s*\/\s*$/im.test(robots.body);
  if (STAGING) {
    check(S, blocked, "staging blocks crawling (robots.txt Disallow: /)", "staging is open to Google — duplicate-content risk");
  } else {
    check(S, !blocked, "robots.txt allows crawling", "robots.txt says Disallow: / — Google would drop the whole site");
    check(S, /sitemap:\s*https:\/\/keshertours\.com\/sitemap\.xml/i.test(robots.body), "robots.txt lists https://keshertours.com/sitemap.xml", robots.body.match(/sitemap:.*/i)?.[0] ?? "no Sitemap line");
    check(S, /disallow:\s*\/admin/i.test(robots.body) && /disallow:\s*\/api\//i.test(robots.body), "robots.txt hides /admin and /api/", "back-office paths are crawlable");
  }
}

// ---------------------------------------------------------------- 2. sitemap
let sitemapUrls = [];
async function sitemap() {
  const S = "Sitemap";
  const res = await get(`${BASE}/sitemap.xml`);
  if (!res.ok || res.status !== 200) return check(S, false, "sitemap.xml reachable", `status ${res.status}`);
  sitemapUrls = [...res.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  check(S, sitemapUrls.length >= 30, `sitemap lists ${sitemapUrls.length} URLs`, "far fewer than expected (~76) — are tours/blog missing?");
  const wrongHost = sitemapUrls.filter((u) => new URL(u).origin !== PROD_ORIGIN);
  check(S, wrongHost.length === 0, "every sitemap URL is on https://keshertours.com", `${wrongHost.length} on another host, e.g. ${wrongHost[0]} — set NEXT_PUBLIC_SITE_URL`, "todo");
  // Fetch each URL on the host being tested (the sitemap's own host may not be live yet in staging).
  const targets = sitemapUrls.map((u) => BASE + new URL(u).pathname);
  const sample = QUICK ? targets.slice(0, 20) : targets;
  const results = await pool(sample, 6, async (u) => ({ u, r: await get(u) }));
  const bad = results.filter((x) => x.r.status !== 200);
  check(S, bad.length === 0, `all ${sample.length} sitemap pages return 200 (no redirects or errors)`, bad.slice(0, 5).map((x) => `${x.r.status} ${x.u}`).join("; "));
  const slow = results.filter((x) => x.r.ms > 4000);
  check(S, slow.length === 0, "no sitemap page took longer than 4s", slow.slice(0, 3).map((x) => `${x.r.ms}ms ${x.u}`).join("; "), "warn");
}

// ---------------------------------------------------------------- 3. page head tags
async function pageHeads() {
  const S = "Page tags";
  const firstTour = sitemapUrls.find((u) => u.includes("/tours/"));
  const firstPost = sitemapUrls.find((u) => u.includes("/blog/") && !u.endsWith("/blog"));
  const pages = ["/", "/about", "/contact", "/faq", "/blog", "/testimonials", "/legal/privacy"];
  if (firstTour) pages.push(new URL(firstTour).pathname);
  if (firstPost) pages.push(new URL(firstPost).pathname);

  for (const p of pages) {
    const res = await get(BASE + p);
    const label = p;
    if (res.status !== 200) { check(S, false, `${label} loads`, `status ${res.status}`); continue; }
    const h = head(res.body);
    check(S, h.titles.length === 1, `${label}: exactly one <title>`, `${h.titles.length} titles`);
    const t = h.titles[0] ?? "";
    check(S, !/keshertours\s*\|\s*keshertours/i.test(t) && t.length > 10 && t.length <= 70, `${label}: title reads well`, `"${t}" (${t.length} chars)`, "warn");
    check(S, !!h.description && h.description.length >= 50 && h.description.length <= 175, `${label}: meta description 50–175 chars`, `${h.description?.length ?? 0} chars`, "warn");
    check(S, !/noindex/i.test(h.robots ?? ""), `${label}: not set to noindex`, `robots meta: ${h.robots}`);
    check(S, h.h1 === 1, `${label}: exactly one <h1>`, `${h.h1} h1 tags`, "warn");
    if (!h.canonical) check(S, false, `${label}: canonical tag present`, "missing");
    else {
      const url = new URL(h.canonical, BASE);
      const expectedPath = stripSlash(p === "/" ? "" : p);
      check(S, stripSlash(url.pathname) === expectedPath, `${label}: canonical path is ${p}`, `canonical is ${h.canonical}`);
      check(S, url.origin === PROD_ORIGIN, `${label}: canonical is on ${PROD_ORIGIN}`, `canonical origin is ${url.origin}`, "todo");
    }
    check(S, !!h.ogImage, `${label}: share image (og:image) set`, "no og:image — links shared on WhatsApp/Facebook show no picture");
    if (p === "/" || p === firstTour?.replace(/^https?:\/\/[^/]+/, "")) check(S, h.jsonLd.length > 0, `${label}: structured data (JSON-LD)`, "none", "warn");
    for (const raw of h.jsonLd) {
      try { JSON.parse(raw); } catch { check(S, false, `${label}: JSON-LD is valid JSON`, "does not parse"); }
    }
    if (p === "/") {
      for (const token of GSC_TOKENS) {
        check(S, res.body.includes(token), `/: Search Console verification tag …${token.slice(0, 6)}`, "missing — Search Console would lose verification");
      }
      check(S, !res.body.includes("wp-content"), "/: this is the new site (no WordPress markup)", "still serving the old WordPress site");
      const leaks = ["hosted.app", "localhost"].filter((s) => res.body.includes(s));
      check(S, leaks.length === 0, "/: no staging or localhost addresses in the page", `found: ${leaks.join(", ")}`, "todo");
      const analytics = /googletagmanager\.com|gtag\(/.test(res.body);
      if (STAGING) check(S, !analytics, "/: analytics stays off on staging", "analytics is firing from staging", "warn");
      else check(S, analytics, "/: Google Analytics is loading", "no analytics tag — check NEXT_PUBLIC_SITE_URL and the GA id", "warn");
    }
  }
  // The share image has to actually load.
  const home = await get(`${BASE}/`);
  const og = head(home.body).ogImage;
  if (og) {
    const img = await get(new URL(og, BASE).toString());
    const type = img.headers.get("content-type") ?? "";
    check(S, img.status === 200 && type.startsWith("image/"), "default share image loads as an image", `status ${img.status}, ${type}`);
  }
}

// ---------------------------------------------------------------- 4. redirects
async function redirects() {
  const S = "Redirects";
  if (!STAGING) {
    const http = await get(`http://${HOST}/`);
    const loc = http.headers.get("location") ?? "";
    check(S, [301, 308].includes(http.status) && loc.startsWith("https://"), "http:// redirects to https:// permanently", `status ${http.status} → ${loc || "none"}`);
    const www = await get(`https://www.${HOST}/`);
    const wloc = www.headers.get("location") ?? "";
    check(S, [301, 308].includes(www.status) && new URL(wloc || "https://x", `https://www.${HOST}`).host === HOST, "www redirects to the bare domain", `status ${www.status} → ${wloc || "none"}`);
  }
  if (!existsSync(AUDIT_CSV)) return report(S, "warn", "old-URL sweep skipped", `missing ${AUDIT_CSV}`);
  const csv = parseCsv(readFileSync(AUDIT_CSV, "utf8").replace(/^﻿/, "")).slice(1).filter((r) => r[0]);
  const old = csv.map((r) => ({ path: r[0], clicks: Number(r[1]), result: r[3] })).sort((a, b) => b.clicks - a.clicks).slice(0, OLD_COUNT);
  const totalClicks = old.reduce((s, o) => s + o.clicks, 0);
  const results = await pool(old, 6, async (o) => ({ o, ...(await follow(BASE + enc(o.path))) }));
  const errors = results.filter((x) => x.final.status !== 200);
  const hard = errors.filter((x) => x.o.clicks >= 50);
  check(S, hard.length === 0, `busiest ${old.length} old URLs (${totalClicks} clicks) all land on a working page`, hard.slice(0, 5).map((x) => `${x.final.status} ${x.o.path} (${x.o.clicks})`).join("; "));
  check(S, errors.length === 0, "…and none at all ends in an error", `${errors.length} do: ${errors.slice(0, 4).map((x) => x.o.path).join(", ")}`, "warn");
  const long = results.filter((x) => x.hops.length > 3);
  check(S, long.length === 0, "no old URL takes more than 3 redirects", long.slice(0, 3).map((x) => `${x.hops.length} hops ${x.o.path}`).join("; "), "warn");
  const metaOnly = results.filter((x) => x.hops.length === 0 && x.final.status === 200 && /http-equiv="refresh"|NEXT_REDIRECT/.test(x.final.body ?? ""));
  check(S, metaOnly.length === 0, "removed pages redirect with a real HTTP status (not a page-level refresh)", metaOnly.slice(0, 3).map((x) => x.o.path).join(", "));
  const home = results.filter((x) => new URL(x.finalUrl).pathname === "/" && new URL(x.finalUrl).search === "" && x.o.path !== "/");
  const homeShare = totalClicks ? Math.round((100 * home.reduce((s, x) => s + x.o.clicks, 0)) / totalClicks) : 0;
  report(S, "info", `${homeShare}% of those clicks end on the plain home page`, "expected for removed tours; revisit with Search Console data after launch");
}

// ---------------------------------------------------------------- 5. error handling & admin
async function errorsAndAdmin() {
  const S = "Errors & admin";
  const nf = await get(`${BASE}/definitely-not-a-page-${Date.now()}`);
  check(S, nf.status === 404, "unknown page returns a real 404", `status ${nf.status}`);
  const nt = await get(`${BASE}/tours/definitely-not-a-tour-${Date.now()}`);
  check(S, nt.status === 404, "unknown tour returns a real 404", `status ${nt.status}`);
  const admin = await get(`${BASE}/admin`);
  check(S, admin.status >= 300 && admin.status < 400 || admin.status === 401 || admin.status === 403, "/admin does not open without signing in", `status ${admin.status}`);
  const api = await get(`${BASE}/api/`);
  check(S, api.status !== 200, "/api/ root is not an open page", `status ${api.status}`, "warn");
  const hsts = (await get(`${BASE}/`)).headers.get("strict-transport-security");
  check(S, STAGING || !!hsts, "HSTS header present", "no Strict-Transport-Security header", "warn");
}

// ---------------------------------------------------------------- 6. DNS & email
async function dnsAndEmail() {
  const S = "DNS & email";
  const domain = "keshertours.com";
  const txt = async (name) => (await dns.resolveTxt(name).catch(() => [])).map((r) => r.join(""));
  const apex = await txt(domain);
  const spf = apex.filter((t) => t.toLowerCase().startsWith("v=spf1"));
  check(S, spf.length === 1, "exactly one SPF record on the domain", spf.length === 0 ? "none" : `${spf.length} SPF records — mail may be rejected`);
  if (spf[0]) check(S, /_spf\.google\.com/.test(spf[0]), "root SPF covers Google mail", spf[0], "warn");
  // Resend keeps its own SPF and bounce records on the send. subdomain, so the root record stays untouched.
  const sendSpf = await txt(`send.${domain}`);
  check(S, sendSpf.some((t) => /amazonses\.com/.test(t)), "Resend SPF on send.keshertours.com", "no amazonses SPF on send. — receipts may land in spam");
  const dkim = await txt(`resend._domainkey.${domain}`);
  check(S, dkim.some((t) => t.includes("p=")), "Resend DKIM record published", "resend._domainkey.keshertours.com has no key");
  const dmarc = await txt(`_dmarc.${domain}`);
  check(S, dmarc.some((t) => t.toLowerCase().startsWith("v=dmarc1")), "DMARC record published", "none — recommended so Gmail trusts the mail", "warn");
  const mx = await dns.resolveMx(domain).catch(() => []);
  check(S, mx.length > 0, "MX records present (Google mail)", "no MX — incoming mail would bounce", "warn");
  const a = await dns.resolve4(domain).catch(() => []);
  report(S, "info", "apex A records", a.join(", ") || "none");
  if (!STAGING) check(S, !a.includes("164.92.205.108"), "domain no longer points at the old WordPress server", "A record still 164.92.205.108", "fail");
  const gsc = apex.filter((t) => t.startsWith("google-site-verification="));
  report(S, gsc.length ? "pass" : "info", `Search Console DNS verification records: ${gsc.length}`, gsc.length ? "" : "none in DNS (the page tags above also verify)");
}

// ---------------------------------------------------------------- run
const sections = [crawlability, sitemap, pageHeads, redirects, errorsAndAdmin, dnsAndEmail];
console.log(`\nLaunch check — ${BASE}  (${STAGING ? "STAGING mode" : "PRODUCTION mode"}${QUICK ? ", quick" : ""})\n`);
for (const run of sections) {
  const before = rows.length;
  try { await run(); } catch (error) { report(run.name, "fail", `${run.name} crashed`, String(error.stack ?? error)); }
  const mine = rows.slice(before);
  if (!mine.length) continue;
  console.log(`── ${mine[0].section}`);
  for (const r of mine) console.log(`  ${ICON[r.level]}  ${r.name}${r.detail ? `\n        ${r.detail}` : ""}`);
  console.log();
}

const count = (l) => rows.filter((r) => r.level === l).length;
console.log("─".repeat(60));
console.log(`${count("pass")} passed · ${count("warn")} warnings · ${count("todo")} launch-day to-dos · ${count("fail")} FAILED`);

console.log(`
By hand (a script can't do these):
  [ ] Booking test: one booking and one lead with a +address, then check the confirmation, staff alert,
      and that the headers show SPF=pass DKIM=pass and the mail is not in spam
  [ ] Pick the reply-to address for customer emails
  [ ] Backup of the old WordPress site stored somewhere outside Cloudways
  [ ] Firebase: domain shows Connected with a certificate, then set NEXT_PUBLIC_SITE_URL=https://keshertours.com and push
  [ ] Search Console: submit https://keshertours.com/sitemap.xml and inspect the home page and two tours
  [ ] Turn on admin 2FA (ADMIN_REQUIRE_2FA) once the email test passes
  [ ] Daily for two weeks: Search Console > Pages (not indexed), Crawl stats (5xx), Performance
`);
process.exit(count("fail") ? 1 : 0);
