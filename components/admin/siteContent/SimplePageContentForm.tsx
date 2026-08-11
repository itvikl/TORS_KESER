"use client";

import { useState } from "react";
import PageHeader from "@/components/marketing/PageHeader";
import { TextField, SaveBar, PreviewFrame } from "@/components/admin/siteContent/SiteContentFields";
import type { SaveSiteContentResult } from "@/lib/actions/siteContent";
import type { SiteContentSimplePage } from "@/lib/types";

/** Shared by /admin/site-content/custom-tours, special-offers, and testimonials — each has only a PageHeader worth of editable copy. */
export default function SimplePageContentForm({
  initialContent,
  saveAction,
}: {
  initialContent: SiteContentSimplePage;
  saveAction: (input: unknown) => Promise<SaveSiteContentResult>;
}) {
  const [draft, setDraft] = useState<SiteContentSimplePage>(initialContent);
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
          label="Eyebrow (small text above the title)"
          value={draft.eyebrow ?? ""}
          onChange={(v) => setDraft((d) => ({ ...d, eyebrow: v }))}
          error={errors.eyebrow}
        />
        <TextField
          label="Title"
          value={draft.title}
          onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
          error={errors.title}
        />
        <TextField
          label="Lede (subtitle paragraph)"
          value={draft.lede ?? ""}
          onChange={(v) => setDraft((d) => ({ ...d, lede: v }))}
          error={errors.lede}
        />
        <SaveBar saving={saving} saved={saved} onSave={handleSave} />
      </div>

      <PreviewFrame>
        <div className="-m-6">
          <PageHeader eyebrow={draft.eyebrow || undefined} title={draft.title} lede={draft.lede || undefined} />
        </div>
      </PreviewFrame>
    </div>
  );
}
