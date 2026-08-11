"use client";

import { useState } from "react";
import PageHeader from "@/components/marketing/PageHeader";
import FaqList from "@/components/marketing/FaqList";
import { TextField, TextAreaField, SaveBar, PreviewFrame } from "@/components/admin/siteContent/SiteContentFields";
import { saveFaqContent } from "@/lib/actions/siteContent";
import type { SiteContentFaq, SiteContentFaqItem } from "@/lib/types";

export default function FaqContentForm({ initialContent }: { initialContent: SiteContentFaq }) {
  const [draft, setDraft] = useState<SiteContentFaq>(initialContent);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateItem(itemId: string, patch: Partial<SiteContentFaqItem>) {
    setDraft((d) => ({
      ...d,
      items: d.items.map((item) => (item.itemId === itemId ? { ...item, ...patch } : item)),
    }));
  }

  function addItem() {
    setDraft((d) => ({
      ...d,
      items: [...d.items, { itemId: crypto.randomUUID(), question: "", answer: "" }],
    }));
  }

  function removeItem(itemId: string) {
    setDraft((d) => ({ ...d, items: d.items.filter((item) => item.itemId !== itemId) }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const result = await saveFaqContent(draft);
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
        <TextField
          label="Lede (subtitle, optional)"
          value={draft.lede ?? ""}
          onChange={(v) => setDraft((d) => ({ ...d, lede: v }))}
          error={errors.lede}
        />

        <div className="space-y-3">
          {draft.items.map((item, index) => (
            <div key={item.itemId} className="rounded-lg border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Question {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.itemId)}
                  className="text-xs font-medium text-terracotta-dark hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="mt-2 space-y-2">
                <TextField
                  label="Question"
                  value={item.question}
                  onChange={(v) => updateItem(item.itemId, { question: v })}
                />
                <TextAreaField
                  label="Answer"
                  value={item.answer}
                  onChange={(v) => updateItem(item.itemId, { answer: v })}
                  rows={3}
                />
              </div>
            </div>
          ))}
          {errors.items && <p className="text-xs text-terracotta-dark">{errors.items[0]}</p>}
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg border border-dashed border-line px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-navy/40 hover:text-navy"
          >
            + Add question
          </button>
        </div>

        <SaveBar saving={saving} saved={saved} onSave={handleSave} />
      </div>

      <PreviewFrame>
        <div className="-m-6">
          <PageHeader title={draft.title} lede={draft.lede || undefined} />
        </div>
        <div className="px-6 py-8">
          <FaqList items={draft.items} />
        </div>
      </PreviewFrame>
    </div>
  );
}
