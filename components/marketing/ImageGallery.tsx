"use client";

import { useState } from "react";

/**
 * Manual-navigation gallery — no auto-rotation (PRD 7.2: carousels should
 * not rely on auto-rotate alone for an audience that includes 50+ users).
 */
export default function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const safeImages = images.length ? images : ["/placeholder.svg"];

  return (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-sand-warm">
        {/* eslint-disable-next-line @next/next/no-img-element -- placeholder photography until real assets land */}
        <img
          src={safeImages[index]}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + safeImages.length) % safeImages.length)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-navy shadow hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % safeImages.length)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-navy shadow hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>
      {safeImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {safeImages.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === index ? "border-terracotta" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
