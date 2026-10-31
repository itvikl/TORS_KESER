"use client";

import { useState } from "react";
import SafeImage from "@/components/ui/SafeImage";

const SIDE_TILES = 3;

export default function TourHeroGallery({
  images,
  alt,
  title,
  badge,
  countries,
  durationDays,
}: {
  images: string[];
  alt: string;
  title: string;
  badge: string;
  countries: string[];
  durationDays: number;
}) {
  // Deduped: a tour's hero image is often repeated in its gallery.
  const safe = images.length ? Array.from(new Set(images)) : ["/placeholder.svg"];
  // Tracks the picked src, not an index — in the admin live preview `images`
  // can change under us, and a removed photo should fall back to the hero.
  const [selectedSrc, setSelectedSrc] = useState<string | null>(null);
  const mainIndex = selectedSrc ? Math.max(safe.indexOf(selectedSrc), 0) : 0;
  const main = safe[mainIndex];
  // The photos after the big one, wrapping around, so picking a tile rotates
  // the strip and every photo stays reachable without the big one repeating.
  const others = [...safe.slice(mainIndex + 1), ...safe.slice(0, mainIndex)];
  const side = others.slice(0, SIDE_TILES);
  const extraCount = others.length - side.length;

  return (
    <section className="relative flex w-full flex-col gap-2 p-2 md:h-[min(716px,80vh)] md:flex-row">
      <div
        className={`group relative h-[420px] overflow-hidden rounded-xl md:h-full ${
          side.length > 0 ? "md:w-2/3" : "md:w-full"
        }`}
      >
        <SafeImage
          src={main}
          alt={alt}
          sizes="(min-width: 768px) 66vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/80 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8">
          <span className="mb-3 inline-block rounded-full border border-[#c8a0f0]/30 bg-[#c8a0f0]/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#c8a0f0]">
            {badge}
          </span>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="text-sm font-medium text-[#a0b4c4] sm:text-base">
            {countries.join(" & ")}
            <span className="mx-2 text-white/30" aria-hidden="true">
              ·
            </span>
            {durationDays} days
          </p>
        </div>
      </div>

      {side.length > 0 && (
        <div className="hidden h-full w-1/3 flex-col gap-2 md:flex">
          {side.map((src, i) => {
            const isLast = i === side.length - 1;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setSelectedSrc(src)}
                aria-label={`Show photo ${safe.indexOf(src) + 1} of ${safe.length}: ${alt}`}
                className="group relative min-h-0 flex-1 cursor-pointer overflow-hidden rounded-xl"
              >
                <SafeImage
                  src={src}
                  alt=""
                  sizes="33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {isLast && extraCount > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-all hover:bg-black/25">
                    <span className="text-lg font-bold text-white">
                      +{extraCount} Photos
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile secondary strip */}
      {side.length > 0 && (
        <div className="flex gap-2 md:hidden">
          {side.map((src) => (
            <button
              key={`m-${src}`}
              type="button"
              onClick={() => setSelectedSrc(src)}
              aria-label={`Show photo ${safe.indexOf(src) + 1} of ${safe.length}: ${alt}`}
              className="relative h-24 flex-1 cursor-pointer overflow-hidden rounded-lg"
            >
              <SafeImage src={src} alt="" sizes="33vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
