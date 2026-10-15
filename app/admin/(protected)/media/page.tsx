import type { Metadata } from "next";
import MediaLibraryBrowser from "@/components/admin/MediaLibraryBrowser";

export const metadata: Metadata = { title: "Image Library" };

/**
 * Manage view of the same catalog MediaLibraryPicker offers inside every
 * image field: create categories, upload into them, and assign images.
 */
export default function AdminMediaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Image Library</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Organize images into categories — tour photos sort into their country automatically. Select
          images to add them to more categories; pick them later from &ldquo;Choose from library&rdquo;
          next to any image field.
        </p>
      </div>
      <div className="flex h-[calc(100vh-12rem)] min-h-[32rem] flex-col overflow-hidden rounded-xl border border-line bg-white">
        <MediaLibraryBrowser mode="manage" />
      </div>
    </div>
  );
}
