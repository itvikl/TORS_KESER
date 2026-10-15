"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * next/image-backed photo that hides itself on load failure, so pages don't
 * show a broken-image icon while real photography (PRD Q10) isn't wired up
 * yet. Always rendered with `fill` — every call site already positions its
 * parent as the sizing container (`relative h-*` or `absolute inset-0`).
 */
export default function SafeImage({
  src,
  alt,
  className,
  sizes = "100vw",
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  // Tracks *which* src failed, not just "failed" — in the admin live preview
  // the same instance gets a new src when a photo is picked, and a boolean
  // would keep it hidden forever after the empty-state placeholder 404s.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
