"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveOffer } from "@/lib/actions/offers";
import ImageUploadButton from "@/components/admin/ImageUploadButton";
import type { SpecialOffer, Tour } from "@/lib/types";

const BLANK_OFFER: SpecialOffer = {
  offerId: "",
  title: "",
  body: "",
  image: undefined,
  tourId: undefined,
  validUntil: undefined,
  status: "draft",
};

export default function OfferEditorForm({
  mode,
  offerId,
  initialOffer,
  tours,
}: {
  mode: "create" | "edit";
  offerId?: string;
  initialOffer?: SpecialOffer;
  tours: Tour[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<SpecialOffer>(initialOffer ?? BLANK_OFFER);
  const [savedOfferId, setSavedOfferId] = useState(offerId);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof SpecialOffer>(key: K, value: SpecialOffer[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(status: SpecialOffer["status"]) {
    setSaving(true);
    setErrors({});

    const payload = { ...draft, status };
    const result = await saveOffer(payload, savedOfferId);

    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      return;
    }

    if (mode === "create") {
      router.replace(`/admin/offers/${result.offerId}`);
    }
    setSavedOfferId(result.offerId);
    setDraft((prev) => ({ ...prev, status }));
    setSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="Offer details">
        <div className="space-y-4">
          <Field label="Title" error={errors.title}>
            <input
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field label="Body" error={errors.body}>
            <textarea
              value={draft.body}
              onChange={(e) => set("body", e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field label="Image">
            <div className="flex items-center gap-3">
              {draft.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
              )}
              <ImageUploadButton
                label={draft.image ? "Replace image" : "Upload image"}
                folder="offers"
                onUploaded={(urls) => set("image", urls[0])}
              />
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Related tour">
              <select
                value={draft.tourId ?? ""}
                onChange={(e) => set("tourId", e.target.value || undefined)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
              >
                <option value="">— None —</option>
                {tours.map((t) => (
                  <option key={t.tourId} value={t.tourId}>
                    {t.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Valid until">
              <input
                type="date"
                value={draft.validUntil ?? ""}
                onChange={(e) => set("validUntil", e.target.value || undefined)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
          </div>
        </div>
      </Section>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave("draft")}
          className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sand-warm disabled:opacity-60"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave("published")}
          className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
        >
          Publish
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-terracotta-dark">{error[0]}</p>}
    </div>
  );
}
