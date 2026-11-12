import { parseBodyLinks } from "@/lib/blogLinks";

/**
 * A blog post body is either rich HTML (written by the admin's rich-text
 * editor) or, for posts saved before the editor existed, plain text with
 * blank lines between paragraphs and optional [text](url) links.
 *
 * Safe to import anywhere (no server-only deps) — the HTML cleaning lives
 * in lib/blogBodySanitize.ts.
 */

/**
 * Text copied out of AI chat tools and search results often carries links
 * wrapped in a Google redirect — google.com/search?q=<url> or
 * google.com/url?q=<url> — and placeholder links ("#", "?q=%23") that go
 * nowhere. Returns the real address, or null when the link should be
 * dropped (its text kept). Any other href is returned unchanged.
 */
export function cleanLinkHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return trimmed; // relative, e.g. /tours/japan
  }
  if (!/(^|\.)google\.[a-z.]+$/i.test(url.hostname) || !/^\/(search|url)$/.test(url.pathname)) return trimmed;
  const target = (url.searchParams.get("q") ?? url.searchParams.get("url") ?? "").trim();
  if (/^https?:\/\//i.test(target)) return target;
  if (target.startsWith("/")) return target;
  return null;
}

/** Rich bodies always start with a block tag; legacy plain text never does. */
export function isHtmlBody(body: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|blockquote|img|div)[\s>/]/i.test(body);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Plain-text body → HTML paragraphs, keeping line breaks and links. */
export function legacyBodyToHtml(body: string): string {
  return body
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      const inner = parseBodyLinks(para)
        .map((s) =>
          s.type === "text"
            ? escapeHtml(s.text).replace(/\n/g, "<br>")
            : `<a href="${escapeHtml(s.href)}">${escapeHtml(s.text)}</a>`
        )
        .join("");
      return `<p>${inner}</p>`;
    })
    .join("");
}

/** Either kind of body as HTML (not yet sanitized). */
export function bodyToHtml(body: string): string {
  return isHtmlBody(body) ? body : legacyBodyToHtml(body);
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, "&");
}

/** The words a reader sees — for excerpts and SEO descriptions. */
export function bodyToPlainText(body: string): string {
  if (!isHtmlBody(body)) {
    return parseBodyLinks(body)
      .map((s) => s.text)
      .join("");
  }
  return decodeBasicEntities(
    body
      .replace(/<\/(p|h[1-6]|li|blockquote|div)>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** Every <img src> in an HTML body — for the image library's "used in". */
export function bodyImageUrls(body: string): string[] {
  if (!isHtmlBody(body)) return [];
  return [...body.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => decodeBasicEntities(m[1]));
}
