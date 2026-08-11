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
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
