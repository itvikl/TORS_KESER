"use client";

import { useRef, useState } from "react";
import { uploadTourPdf } from "@/lib/actions/uploads";
import { useToast } from "@/components/admin/feedback/AdminFeedbackProvider";

/** Uploads one or more PDFs through the admin-only server action; hands back each file's public URL and name. */
export default function PdfUploadButton({
  label = "Upload PDF",
  onUploaded,
}: {
  label?: string;
  onUploaded: (files: { url: string; fileName: string }[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    const uploaded: { url: string; fileName: string }[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadTourPdf(formData).catch(() => ({ ok: false as const, error: "Upload failed." }));
      if (result.ok) {
        uploaded.push({ url: result.url, fileName: result.fileName });
      } else {
        toast.error({ title: `Couldn't upload ${file.name}`, description: result.error });
      }
    }

    if (uploaded.length > 0) {
      onUploaded(uploaded);
      toast.success({
        title: uploaded.length === 1 ? "PDF uploaded" : `${uploaded.length} PDFs uploaded`,
        description: "Remember to save the tour to keep this change.",
      });
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand-warm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      {uploading ? "Uploading…" : label}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        disabled={uploading}
        onChange={handleChange}
        className="hidden"
      />
    </label>
  );
}
