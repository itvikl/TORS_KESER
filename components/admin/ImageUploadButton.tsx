"use client";

import { useRef, useState } from "react";
import { uploadTourImage } from "@/lib/actions/uploads";

export default function ImageUploadButton({
  label,
  multiple = false,
  onUploaded,
}: {
  label: string;
  multiple?: boolean;
  onUploaded: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    const urls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadTourImage(formData);
      if (result.ok) {
        urls.push(result.url);
      } else {
        setError(result.error);
      }
    }

    if (urls.length > 0) onUploaded(urls);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
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
      {error && <p className="mt-1 text-xs font-medium text-terracotta-dark">{error}</p>}
    </div>
  );
}
