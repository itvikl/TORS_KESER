"use client";

import { useState } from "react";
import { useDirtyDraft, useToast } from "@/components/admin/feedback/AdminFeedbackProvider";
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
        <SaveBar saving={saving} dirty={isDirty} onSave={handleSave} />
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
