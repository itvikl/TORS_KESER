import "server-only";
import sanitizeHtml from "sanitize-html";
import { bodyToHtml, cleanLinkHref } from "@/lib/blogBody";

/**
 * The only HTML a blog body may contain — what the admin editor can
 * produce. Runs when a post is saved and again when it is shown, so even a
 * body written straight into Firestore can't put scripts, styles or
 * javascript: links on the public site.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  transformTags: {
    // Pasted or older content may use b/i/h1/h4 — map to what we style.
    b: "strong",
    i: "em",
    h1: "h2",
    h4: "h3",
    h5: "h3",
    h6: "h3",
    a: (tagName, attribs) => {
      // Google-redirect wrappers are unwrapped; placeholder links ("#") lose
      // their href here and the bare <a> is unwrapped in sanitizeBlogHtml.
      // (Renaming the tag to a disallowed one confuses sanitize-html's
      // closing-tag bookkeeping for the links that follow.)
      const href = cleanLinkHref(attribs.href ?? "");
      if (href === null) return { tagName, attribs: {} };
      const external = /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?keshertours\.com(\/|$)/i.test(href);
      const attrs: sanitizeHtml.Attributes = external
        ? { href, target: "_blank", rel: "noopener noreferrer" }
        : { href };
      return { tagName, attribs: attrs };
    },
  },
};

export function sanitizeBlogHtml(html: string): string {
  // sanitize-html keeps relative/empty img srcs; only full https images are real pictures.
  return (
    sanitizeHtml(html, OPTIONS)
      .replace(/<img(?![^>]*\ssrc="https:\/\/)[^>]*>/gi, "")
      // Links whose href was dropped (placeholders) — keep just their text.
      .replace(/<a>([\s\S]*?)<\/a>/g, "$1")
  );
}

/** Any stored body (rich or legacy plain text) → safe HTML for the page. */
export function renderBlogBody(body: string): string {
  return sanitizeBlogHtml(bodyToHtml(body));
}
