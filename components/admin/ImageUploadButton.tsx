"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/actions/uploads";
import MediaLibraryPicker from "@/components/admin/MediaLibraryPicker";
import { useToast } from "@/components/admin/feedback/AdminFeedbackProvider";

export default function ImageUploadButton({
  label,
  multiple = false,
  folder = "tours",
  onUploaded,
}: {
  label: string;
  multiple?: boolean;
  folder?: string;
  onUploaded: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const [libraryOpen, setLibraryOpen] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    const urls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadImage(formData, folder).catch(() => ({ ok: false as const, error: "Upload failed." }));
      if (result.ok) {
        urls.push(result.url);
      } else {
        toast.error({ title: `Couldn't upload ${file.name}`, description: result.error });
      }
    }

    if (urls.length > 0) {
      onUploaded(urls);
      toast.success({
        title: urls.length === 1 ? "Image uploaded" : `${urls.length} images uploaded`,
        description: "Remember to save to keep this change.",
      });
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand-warm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
          {uploading ? "Uploading…" : label}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={multiple}
            disabled={uploading}
            onChange={handleChange}
            className="hidden"
          />
        </label>
        <button
          type="button"
          disabled={uploading}
          onClick={() => setLibraryOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand-warm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Choose from library
        </button>
      </div>
      {libraryOpen && (
        <MediaLibraryPicker
          multiple={multiple}
          onSelect={onUploaded}
          onClose={() => setLibraryOpen(false)}
        />
      )}
    </div>
  );
}
