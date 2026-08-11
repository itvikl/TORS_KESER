"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/marketing/PageHeader";
import { TextField, SaveBar, PreviewFrame } from "@/components/admin/siteContent/SiteContentFields";
import { saveContactContent } from "@/lib/actions/siteContent";
import type { SiteContentContact } from "@/lib/types";

export default function ContactContentForm({
  initialContent,
  primaryPhone,
  secondaryPhone,
}: {
  initialContent: SiteContentContact;
  primaryPhone: string;
  secondaryPhone?: string;
}) {
  const [draft, setDraft] = useState<SiteContentContact>(initialContent);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const result = await saveContactContent(draft);
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
          label="Lede (subtitle)"
          value={draft.lede}
          onChange={(v) => setDraft((d) => ({ ...d, lede: v }))}
          error={errors.lede}
        />

        <p className="rounded-lg border border-dashed border-line bg-sand-warm/40 p-3 text-xs text-ink-muted">
          The phone numbers shown on this page come from{" "}
          <Link href="/admin/settings" className="font-medium text-navy hover:underline">
            Settings
          </Link>
          , not from here — that way Header, Footer, and Contact always show the same number.
        </p>

        <SaveBar saving={saving} saved={saved} onSave={handleSave} />
      </div>

      <PreviewFrame>
        <div className="-m-6">
          <PageHeader title={draft.title} lede={draft.lede} />
        </div>
        <div className="px-6 py-8">
          <div className="glass-panel flex flex-col items-center gap-2 rounded-2xl p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">
              Prefer to talk?
            </p>
            <span className="font-display text-3xl font-bold text-[#e0e8f0]">{primaryPhone}</span>
            {secondaryPhone && <span className="text-sm text-[#a0b4c4]">or {secondaryPhone}</span>}
          </div>
        </div>
      </PreviewFrame>
    </div>
  );
}
