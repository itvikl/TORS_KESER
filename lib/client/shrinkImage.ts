/**
 * Resizes a photo in the browser before it is uploaded.
 *
 * Why: the deployed site serves every image at exactly the size it was
 * uploaded (Firebase App Hosting doesn't provide Next's /_next/image resizer),
 * so a 10MB stock photo is 10MB for every visitor — and anything over the
 * Server Action body limit (10MB, next.config.ts) fails to upload at all.
 * Resizing here keeps pages fast and makes big originals upload reliably.
 *
 * The long edge is capped (3200px for full-width backgrounds, which stay sharp on 2560px
 * and most Retina screens; 2000px for everything else, which is shown much smaller),
 * re-encoded as WebP at quality 85 (JPEG where the browser can't write WebP). Small images, GIFs and
 * anything the browser can't decode are returned untouched.
 */
/** Default cap — tour photos, cards, avatars: displayed well under 2000px even on Retina. */
const DEFAULT_MAX_EDGE = 2000;
/** Cap for full-width backgrounds (home hero, page headers). */
export const BACKGROUND_MAX_EDGE = 3200;
const LEAVE_ALONE_BELOW_BYTES = 600 * 1024;

export async function shrinkImage(file: File, maxEdge = DEFAULT_MAX_EDGE): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    // Honors the photo's EXIF rotation, so a phone photo isn't saved sideways.
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= LEAVE_ALONE_BELOW_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  let blob = await encode("image/webp", 0.85);
  if (!blob || blob.type !== "image/webp") {
    // This browser can't write WebP. JPEG has no transparency, so put white behind the picture.
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    blob = await encode("image/jpeg", 0.86);
  }
  if (!blob || (scale === 1 && blob.size >= file.size)) return file;

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${extension}`, { type: blob.type });
}
