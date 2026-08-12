"use client";

import { useEffect, useState } from "react";
import SafeImage from "@/components/ui/SafeImage";

const SLIDE_INTERVAL_MS = 9000;

/**
 * Soft, slowly-crossfading tour-photo backdrop for the booking page — it
 * inherited a flat dark background before this, which the client felt was
 * "too dark". Purely decorative: absolutely positioned behind the page's
 * own content, with a dark gradient overlay to keep form text readable.
 */
export default function BookingPageBackground({ images }: { images: string[] }) {
  const safeImages = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!animate || safeImages.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % safeImages.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [animate, safeImages.length]);

  if (safeImages.length === 0) return null;

  return (
    <div className="absolute inset-0 -z-10 min-h-full" aria-hidden="true">
      {safeImages.map((src, i) => (
        <SafeImage
          key={src}
          src={src}
          alt=""
          className={`scale-105 object-cover blur-md transition-opacity duration-[2000ms] ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-scrim)]/50 via-[var(--color-scrim)]/60 to-[var(--color-scrim)]/85 transition-colors" />
    </div>
  );
}
