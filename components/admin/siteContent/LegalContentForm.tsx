"use client";

import { useState } from "react";
import PageHeader from "@/components/marketing/PageHeader";
import { TextField, TextAreaField, SaveBar, PreviewFrame } from "@/components/admin/siteContent/SiteContentFields";
import type { SaveSiteContentResult } from "@/lib/actions/siteContent";
import type { SiteContentLegal } from "@/lib/types";

/** Shared by /admin/site-content/legal-privacy and legal-terms — a title plus one long free-text body. */
export default function LegalContentForm({
  initialContent,
  saveAction,
}: {
  initialContent: SiteContentLegal;
  saveAction: (input: unknown) => Promise<SaveSiteContentResult>;
}) {
  const [draft, setDraft] = useState<SiteContentLegal>(initialContent);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const result = await saveAction(draft);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaved(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <TextField
          label="Title"
          value={draft.title}
          onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
          error={errors.title}
        />
        <TextAreaField
          label="Body text"
          value={draft.body}
          onChange={(v) => setDraft((d) => ({ ...d, body: v }))}
          rows={18}
          error={errors.body}
        />
        <SaveBar saving={saving} saved={saved} onSave={handleSave} />
      </div>

      <PreviewFrame>
        <div className="-m-6">
          <PageHeader eyebrow="Legal" title={draft.title} />
        </div>
        <div className="px-6 py-8">
          <section className="glass-panel rounded-2xl p-6 sm:p-8">
            <p className="whitespace-pre-line text-[15px] leading-7 text-[#a0b4c4]">{draft.body}</p>
          </section>
        </div>
      </PreviewFrame>
    </div>
  );
}
