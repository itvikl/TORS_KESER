import type { ImageFocus } from "@/lib/types";

/** CSS `object-position` for a photo's chosen focus, or undefined (= the default centered crop) when none was set. */
export function focusPosition(focus: ImageFocus[] | undefined, url: string | undefined): string | undefined {
  if (!url) return undefined;
  const entry = focus?.find((f) => f.url === url);
  return entry ? `${entry.x}% ${entry.y}%` : undefined;
}

/** A copy of `focus` with this photo's point set — or cleared, when `point` is undefined. */
export function withImageFocus(
  focus: ImageFocus[] | undefined,
  url: string,
  point: { x: number; y: number } | undefined
): ImageFocus[] {
  const rest = (focus ?? []).filter((f) => f.url !== url);
  if (!point) return rest;
  return [...rest, { url, x: Math.round(point.x), y: Math.round(point.y) }];
}
