/**
 * Legacy (pre-editor) blog bodies are plain text with optional inline links written as
 * [link text](url) — the same form Markdown uses. Only http(s), mailto and
 * site-relative ("/tours/japan") URLs count as links; anything else stays
 * literal text, so a body can never inject a javascript: or data: link.
 *
 * Bodies saved by the rich-text editor are HTML instead; this format only
 * survives in posts saved before it, which lib/blogBody.ts converts.
 */

export type BodySegment = { type: "text"; text: string } | { type: "link"; text: string; href: string };

// [text](url) or a bare http(s) URL. Bare URLs stop before trailing
// punctuation so "see https://x.com." doesn't swallow the full stop.
const LINK_PATTERN =
  /\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:|\/)[^\s)]*)\)|(https?:\/\/[^\s<>()\[\]]*[^\s<>()\[\].,;:!?'"])/g;

export function parseBodyLinks(body: string): BodySegment[] {
  const segments: BodySegment[] = [];
  let last = 0;
  for (const match of body.matchAll(LINK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ type: "text", text: body.slice(last, index) });
    if (match[3]) segments.push({ type: "link", text: match[3], href: match[3] });
    else segments.push({ type: "link", text: match[1], href: match[2] });
    last = index + match[0].length;
  }
  if (last < body.length) segments.push({ type: "text", text: body.slice(last) });
  return segments;
}
