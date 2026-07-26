"use client";

/**
 * Plain <img> that hides itself on load failure, so pages don't show a
 * broken-image icon while real photography (PRD Q10) isn't wired up yet.
 * A client component because Server Components can't pass event handlers.
 */
export default function SafeImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- placeholder photography until real assets land
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
