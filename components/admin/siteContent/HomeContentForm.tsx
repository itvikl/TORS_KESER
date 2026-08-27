"use client";

import { useState } from "react";
import HomeHeroContent from "@/components/marketing/HomeHeroContent";
import HomeTrustSignals from "@/components/marketing/HomeTrustSignals";
import HomeCtaSection from "@/components/marketing/HomeCtaSection";
import { TextField, TextAreaField, SaveBar, PreviewFrame } from "@/components/admin/siteContent/SiteContentFields";
import { saveHomeContent } from "@/lib/actions/siteContent";
import type { SiteContentHome } from "@/lib/types";

export default function HomeContentForm({ initialContent }: { initialContent: SiteContentHome }) {
  const [draft, setDraft] = useState<SiteContentHome>(initialContent);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof SiteContentHome>(key: K, value: SiteContentHome[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setTrustSignal(index: 0 | 1 | 2, patch: Partial<{ title: string; body: string }>) {
    setDraft((d) => {
      const trustSignals = [...d.trustSignals] as SiteContentHome["trustSignals"];
      trustSignals[index] = { ...trustSignals[index], ...patch };
      return { ...d, trustSignals };
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const result = await saveHomeContent(draft);
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
      <div className="space-y-6">
        <FieldGroup title="Hero">
          <TextField label="Eyebrow" value={draft.heroEyebrow} onChange={(v) => set("heroEyebrow", v)} error={errors.heroEyebrow} />
          <TextField label="Title — line 1" value={draft.heroTitleLine1} onChange={(v) => set("heroTitleLine1", v)} error={errors.heroTitleLine1} />
          <TextField label="Title — highlighted line" value={draft.heroTitleHighlight} onChange={(v) => set("heroTitleHighlight", v)} error={errors.heroTitleHighlight} />
          <TextAreaField label="Subtitle" value={draft.heroSubtitle} onChange={(v) => set("heroSubtitle", v)} rows={2} error={errors.heroSubtitle} />
          <TextField label="Primary button" value={draft.heroPrimaryCta} onChange={(v) => set("heroPrimaryCta", v)} error={errors.heroPrimaryCta} />
        </FieldGroup>

        <FieldGroup title="Trust signals">
          {([0, 1, 2] as const).map((index) => (
            <div key={index} className="rounded-lg border border-line bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Card {index + 1}
              </p>
              <div className="space-y-2">
                <TextField
                  label="Title"
                  value={draft.trustSignals[index].title}
                  onChange={(v) => setTrustSignal(index, { title: v })}
                />
                <TextAreaField
                  label="Body"
                  value={draft.trustSignals[index].body}
                  onChange={(v) => setTrustSignal(index, { body: v })}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </FieldGroup>

        <FieldGroup title="Closing call-to-action">
          <TextField label="Heading" value={draft.ctaHeading} onChange={(v) => set("ctaHeading", v)} error={errors.ctaHeading} />
          <TextField label="Heading — highlighted part" value={draft.ctaHeadingHighlight} onChange={(v) => set("ctaHeadingHighlight", v)} error={errors.ctaHeadingHighlight} />
          <TextAreaField label="Body" value={draft.ctaBody} onChange={(v) => set("ctaBody", v)} rows={3} error={errors.ctaBody} />
          <TextField label="Primary button" value={draft.ctaPrimaryButton} onChange={(v) => set("ctaPrimaryButton", v)} error={errors.ctaPrimaryButton} />
          <TextField label="Secondary button" value={draft.ctaSecondaryButton} onChange={(v) => set("ctaSecondaryButton", v)} error={errors.ctaSecondaryButton} />
        </FieldGroup>

        <SaveBar saving={saving} saved={saved} onSave={handleSave} />
      </div>

      <PreviewFrame>
        <div className="-m-6 space-y-10 py-10">
          <div className="px-6 text-center">
            <HomeHeroContent content={draft} interactive={false} />
          </div>
          <div className="px-6">
            <HomeTrustSignals signals={draft.trustSignals} />
          </div>
          <div className="px-6">
            <HomeCtaSection content={draft} interactive={false} />
          </div>
        </div>
      </PreviewFrame>
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
