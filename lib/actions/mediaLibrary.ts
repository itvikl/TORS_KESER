"use server";

import { requireAdminSession } from "@/lib/auth/dal";
import {
  createMediaCategoryDoc,
  deleteMediaCategoryDoc,
  getMediaLibrary,
  isCountryCategoryId,
  mediaCategoryExists,
  renameMediaCategoryDoc,
  setImagesCategoryDoc,
  type MediaLibrary,
} from "@/lib/data/admin/mediaLibrary";

// No revalidatePath here on purpose: MediaLibraryBrowser re-fetches the
// library itself after every change, and revalidating would refresh
// whatever page the picker is open on (e.g. the tour editor) for nothing.

export type MediaCategoryResult = { ok: true; categoryId: string } | { ok: false; error: string };

function cleanName(name: string): string | null {
  const trimmed = name.trim();
  return trimmed && trimmed.length <= 60 ? trimmed : null;
}

/** Feeds MediaLibraryPicker — fetched on open rather than passed down from every page that has an image field. */
export async function listMediaLibrary(): Promise<MediaLibrary> {
  await requireAdminSession();
  return getMediaLibrary();
}

export async function createMediaCategory(name: string): Promise<MediaCategoryResult> {
  await requireAdminSession();
  const clean = cleanName(name);
  if (!clean) return { ok: false, error: "Enter a category name (up to 60 characters)." };

  const { categories } = await getMediaLibrary();
  if (categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
    return { ok: false, error: "A category with this name already exists." };
  }

  const categoryId = await createMediaCategoryDoc(clean);
  return { ok: true, categoryId };
}

export async function renameMediaCategory(
  categoryId: string,
  name: string
): Promise<MediaCategoryResult> {
  await requireAdminSession();
  if (isCountryCategoryId(categoryId)) {
    return { ok: false, error: "Country categories are named after the country." };
  }
  const clean = cleanName(name);
  if (!clean) return { ok: false, error: "Enter a category name (up to 60 characters)." };

  await renameMediaCategoryDoc(categoryId, clean);
  return { ok: true, categoryId };
}

export async function deleteMediaCategory(categoryId: string): Promise<{ ok: boolean }> {
  await requireAdminSession();
  if (isCountryCategoryId(categoryId)) return { ok: false };
  await deleteMediaCategoryDoc(categoryId);
  return { ok: true };
}

/** Manual add/remove only — automatic country membership (from tour usage) can't be removed here. */
export async function setImagesCategory(
  urls: string[],
  categoryId: string,
  assigned: boolean
): Promise<{ ok: boolean }> {
  await requireAdminSession();
  const validUrls = urls.filter((url) => /^(https?:\/\/|\/)/.test(url)).slice(0, 200);
  if (validUrls.length === 0 || !(await mediaCategoryExists(categoryId))) return { ok: false };

  await setImagesCategoryDoc(validUrls, categoryId, assigned);
  return { ok: true };
}
