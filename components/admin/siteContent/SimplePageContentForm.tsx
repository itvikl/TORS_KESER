"use client";

import { useState } from "react";
import { useDirtyDraft, useToast } from "@/components/admin/feedback/AdminFeedbackProvider";
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
  const toast = useToast();
  const { isDirty, markSaved } = useDirtyDraft(draft);

  async function handleSave() {
    setSaving(true);
    let result;
    try {
      result = await saveAction(draft);
    } catch {
      setSaving(false);
      toast.error({ title: "Save failed", description: "Something went wrong on the server — please try again." });
      return;
    }
    setSaving(false);
    if (!result.ok) {
      setErrors(result.errors);
      toast.error({ title: "Not saved", description: "Please fix the highlighted fields and try again." });
      return;
    }
    setErrors({});
    markSaved(draft);
    toast.success({ title: "Changes saved", description: "The page content was updated successfully." });
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
        <SaveBar saving={saving} dirty={isDirty} onSave={handleSave} />
      </div>

      <PreviewFrame>
        <div className="-m-6">
          <PageHeader eyebrow={draft.eyebrow || undefined} title={draft.title} lede={draft.lede || undefined} />
        </div>
      </PreviewFrame>
    </div>
  );
}
