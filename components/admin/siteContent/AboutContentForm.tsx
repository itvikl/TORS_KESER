"use client";

import { useState } from "react";
import PageHeader from "@/components/marketing/PageHeader";
import AboutSections from "@/components/marketing/AboutSections";
import { TextField, TextAreaField, SaveBar, PreviewFrame } from "@/components/admin/siteContent/SiteContentFields";
import { saveAboutContent } from "@/lib/actions/siteContent";
import type { SiteContentAbout, SiteContentSection } from "@/lib/types";

export default function AboutContentForm({ initialContent }: { initialContent: SiteContentAbout }) {
  const [draft, setDraft] = useState<SiteContentAbout>(initialContent);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateSection(sectionId: string, patch: Partial<SiteContentSection>) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.sectionId === sectionId ? { ...s, ...patch } : s)),
    }));
  }

  function addSection() {
    setDraft((d) => ({
      ...d,
      sections: [...d.sections, { sectionId: crypto.randomUUID(), heading: "", body: "" }],
    }));
  }

  function removeSection(sectionId: string) {
    setDraft((d) => ({ ...d, sections: d.sections.filter((s) => s.sectionId !== sectionId) }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const result = await saveAboutContent(draft);
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
          label="Eyebrow"
          value={draft.eyebrow}
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
          label="Lede (subtitle)"
          value={draft.lede}
          onChange={(v) => setDraft((d) => ({ ...d, lede: v }))}
          error={errors.lede}
        />

        <div className="space-y-3">
          {draft.sections.map((section, index) => (
            <div key={section.sectionId} className="rounded-lg border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Section {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeSection(section.sectionId)}
                  className="text-xs font-medium text-terracotta-dark hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="mt-2 space-y-2">
                <TextField
                  label="Heading"
                  value={section.heading}
                  onChange={(v) => updateSection(section.sectionId, { heading: v })}
                />
                <TextAreaField
                  label="Body"
                  value={section.body}
                  onChange={(v) => updateSection(section.sectionId, { body: v })}
                  rows={4}
                />
              </div>
            </div>
          ))}
          {errors.sections && <p className="text-xs text-terracotta-dark">{errors.sections[0]}</p>}
          <button
            type="button"
            onClick={addSection}
            className="rounded-lg border border-dashed border-line px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-navy/40 hover:text-navy"
          >
            + Add section
          </button>
        </div>

        <SaveBar saving={saving} saved={saved} onSave={handleSave} />
      </div>

      <PreviewFrame>
        <div className="-m-6">
          <PageHeader eyebrow={draft.eyebrow} title={draft.title} lede={draft.lede} />
        </div>
        <div className="px-6 py-8">
          <AboutSections sections={draft.sections} />
        </div>
      </PreviewFrame>
    </div>
  );
}
