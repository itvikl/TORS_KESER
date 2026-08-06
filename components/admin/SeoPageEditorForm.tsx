"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSeoPage } from "@/lib/actions/seoPages";
import type { SeoLandingPage, Tour } from "@/lib/types";

const BLANK: SeoLandingPage = {
  pageId: "",
  slug: "",
  title: "",
  body: "",
  tourIds: [],
  seoTitle: undefined,
  seoDescription: undefined,
  status: "draft",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SeoPageEditorForm({
  mode,
  pageId,
  initialPage,
  tours,
}: {
  mode: "create" | "edit";
  pageId?: string;
  initialPage?: SeoLandingPage;
  tours: Tour[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<SeoLandingPage>(initialPage ?? BLANK);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [savedPageId, setSavedPageId] = useState(pageId);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof SeoLandingPage>(key: K, value: SeoLandingPage[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function setTitle(value: string) {
    setDraft((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  }

  function toggleTour(tourId: string) {
    setDraft((prev) => ({
      ...prev,
      tourIds: prev.tourIds.includes(tourId)
        ? prev.tourIds.filter((id) => id !== tourId)
        : [...prev.tourIds, tourId],
    }));
  }

  async function handleSave(status: SeoLandingPage["status"]) {
    setSaving(true);
    setErrors({});

    const payload = { ...draft, status };
    const result = await saveSeoPage(payload, savedPageId);

    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      return;
    }

    if (mode === "create") {
      router.replace(`/admin/seo-pages/${result.pageId}`);
    }
    setSavedPageId(result.pageId);
    setDraft(payload);
    setSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="Page">
        <div className="space-y-4">
          <Field label="Title" error={errors.title}>
            <input
              value={draft.title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field label="Slug" hint="e.g. kosher-tour-to-greece" error={errors.slug}>
            <input
              value={draft.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field label="Body" error={errors.body}>
            <textarea
              value={draft.body}
              onChange={(e) => set("body", e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
        </div>
      </Section>

      <Section title="Linked tours">
        <div className="grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">
          {tours.map((tour) => (
            <label key={tour.tourId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-sand-warm">
              <input
                type="checkbox"
                checked={draft.tourIds.includes(tour.tourId)}
                onChange={() => toggleTour(tour.tourId)}
              />
              {tour.title}
            </label>
          ))}
        </div>
      </Section>

      <Section title="SEO">
        <div className="space-y-4">
          <Field label="SEO title">
            <input
              value={draft.seoTitle ?? ""}
              onChange={(e) => set("seoTitle", e.target.value || undefined)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field label="SEO description">
            <textarea
              value={draft.seoDescription ?? ""}
              onChange={(e) => set("seoDescription", e.target.value || undefined)}
              rows={2}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
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
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-terracotta-dark">{error[0]}</p>}
    </div>
  );
}
