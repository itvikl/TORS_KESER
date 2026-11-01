"use client";

import ImageUploadButton from "@/components/admin/ImageUploadButton";

const SHAPES = {
  round: "h-16 w-16 rounded-full",
  square: "h-16 w-16 rounded-lg",
  wide: "h-24 w-40 rounded-lg",
};

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
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  /** Storage folder for new uploads (tours, staff, reviews, …). */
  folder?: string;
  shape?: keyof typeof SHAPES;
  /** Wording for the buttons: "Upload photo", "Replace image", … */
  noun?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail, not public-facing content
        <img src={value} alt="" className={`${SHAPES[shape]} shrink-0 object-cover`} />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <ImageUploadButton
          label={value ? `Replace ${noun}` : `Upload ${noun}`}
          folder={folder}
          onUploaded={([url]) => url && onChange(url)}
        />
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
}: {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}) {
  return (
    <div>
      {values.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-3">
          {values.map((src, index) => (
            <li key={`${src}-${index}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail, not public-facing content */}
              <img src={src} alt="" className="h-20 w-28 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
                aria-label={`Remove photo ${index + 1}`}
                title="Remove"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white text-xs font-bold text-terracotta-dark shadow transition-colors hover:bg-terracotta hover:text-white"
              >
                ✕
              </button>
            </li>
          ))}
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
