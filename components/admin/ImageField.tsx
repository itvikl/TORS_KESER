"use client";

import ImageUploadButton from "@/components/admin/ImageUploadButton";

const SHAPES = {
  round: "h-16 w-16 rounded-full",
  square: "h-16 w-16 rounded-lg",
  wide: "h-24 w-40 rounded-lg",
};

type Point = { x: number; y: number };

/** Optional crop-focus support: a "Set focus" button per picture and the thumbnails showing the chosen crop. */
type FocusProps = {
  focusOf?: (url: string) => Point | undefined;
  onSetFocus?: (url: string) => void;
};

const positionOf = (point: Point | undefined) => (point ? `${point.x}% ${point.y}%` : undefined);

/**
 * One uploaded image in an admin form: the picture itself (never its URL),
 * upload / choose-from-library to change it, and a Remove button. Removing
 * only clears it from this item — the file stays in the image library, which
 * has its own delete.
 */
export default function ImageField({
  value,
  onChange,
  folder,
  shape = "square",
  noun = "image",
  focusOf,
  onSetFocus,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  /** Storage folder for new uploads (tours, staff, reviews, …). */
  folder?: string;
  shape?: keyof typeof SHAPES;
  /** Wording for the buttons: "Upload photo", "Replace image", … */
  noun?: string;
} & FocusProps) {
  const focus = value ? focusOf?.(value) : undefined;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail, not public-facing content
        <img
          src={value}
          alt=""
          className={`${SHAPES[shape]} shrink-0 object-cover`}
          style={{ objectPosition: positionOf(focus) }}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <ImageUploadButton
          label={value ? `Replace ${noun}` : `Upload ${noun}`}
          folder={folder}
          onUploaded={([url]) => url && onChange(url)}
        />
        {value && onSetFocus && (
          <button
            type="button"
            onClick={() => onSetFocus(value)}
            className="rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand-warm"
          >
            {focus ? "Focus ✓" : "Set focus"}
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-terracotta-dark transition-colors hover:bg-terracotta/10"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Several uploaded images (a tour's gallery): a grid of the pictures, each
 * with a delete button on its corner, and an upload control that adds more.
 */
export function ImageGalleryField({
  values,
  onChange,
  folder,
  focusOf,
  onSetFocus,
}: {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
} & FocusProps) {
  return (
    <div>
      {values.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-3">
          {values.map((src, index) => {
            const focus = focusOf?.(src);
            return (
              <li key={`${src}-${index}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail, not public-facing content */}
                <img
                  src={src}
                  alt=""
                  className="h-20 w-28 rounded-lg object-cover"
                  style={{ objectPosition: positionOf(focus) }}
                />
                <button
                  type="button"
                  onClick={() => onChange(values.filter((_, i) => i !== index))}
                  aria-label={`Remove photo ${index + 1}`}
                  title="Remove"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white text-xs font-bold text-terracotta-dark shadow transition-colors hover:bg-terracotta hover:text-white"
                >
                  ✕
                </button>
                {onSetFocus && (
                  <button
                    type="button"
                    onClick={() => onSetFocus(src)}
                    aria-label={`Set focus for photo ${index + 1}`}
                    className="absolute bottom-1 left-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white transition-colors hover:bg-black/85"
                  >
                    {focus ? "Focus ✓" : "Set focus"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ImageUploadButton
        label={values.length > 0 ? "Add more images" : "Upload images"}
        multiple
        folder={folder}
        onUploaded={(urls) => onChange([...values, ...urls])}
      />
    </div>
  );
}
