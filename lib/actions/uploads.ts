"use server";

import { randomUUID } from "node:crypto";
import { requireAdminSession } from "@/lib/auth/dal";
import { adminStorage } from "@/lib/firebase/admin";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type UploadImageResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Uploads an image to Firebase Storage via the Admin SDK (server-only —
 * consistent with the rest of the admin write path, and avoids needing
 * public Storage security rules for client uploads). Called directly from
 * ImageUploadButton with a FormData containing one "file" entry; `folder`
 * namespaces the storage path per admin category (tours, reviews, blog, ...).
 */
export async function uploadImage(formData: FormData, folder = "tours"): Promise<UploadImageResult> {
  await requireAdminSession();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided." };
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return { ok: false, error: "Only JPEG, PNG, WebP or GIF images are allowed." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image is too large (max 8MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${folder}/${randomUUID()}.${extension}`;
  const downloadToken = randomUUID();

  const bucket = adminStorage().bucket();
  const blob = bucket.file(path);
  // A download token (rather than blob.makePublic()) is what Firebase
  // Storage itself uses for public URLs — newer buckets (the
  // *.firebasestorage.app ones Firebase now provisions by default) have
  // Uniform Bucket-Level Access on, which rejects the legacy per-object ACL
  // that makePublic() relies on.
  await blob.save(buffer, {
    contentType: file.type,
    metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } },
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    path
  )}?alt=media&token=${downloadToken}`;

  return { ok: true, url };
}

const PASSPORT_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const PASSPORT_ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Uploads a traveler's passport scan/photo during the public booking flow —
 * unlike uploadImage, deliberately has no requireAdminSession() gate, since
 * it runs before a booking (and therefore any staff session) exists. Kept
 * as a separate action rather than reusing uploadImage so the two can
 * diverge on allowed types (PDF) and folder without touching the
 * admin-authenticated path.
 */
export async function uploadPassportScan(formData: FormData): Promise<UploadImageResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided." };
  }

  const extension = PASSPORT_ALLOWED_TYPES[file.type];
  if (!extension) {
    return { ok: false, error: "Only JPEG, PNG, WebP images or PDF files are allowed." };
  }
  if (file.size > PASSPORT_MAX_BYTES) {
    return { ok: false, error: "File is too large (max 10MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `passport-scans/${randomUUID()}.${extension}`;
  const downloadToken = randomUUID();

  const bucket = adminStorage().bucket();
  const blob = bucket.file(path);
  await blob.save(buffer, {
    contentType: file.type,
    metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } },
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    path
  )}?alt=media&token=${downloadToken}`;

  return { ok: true, url };
}
