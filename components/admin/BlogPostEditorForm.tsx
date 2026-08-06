"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBlogPost } from "@/lib/actions/blog";
import ImageUploadButton from "@/components/admin/ImageUploadButton";
import type { BlogPost } from "@/lib/types";

const BLANK_POST: BlogPost = {
  postId: "",
  slug: "",
  title: "",
  body: "",
  heroImage: undefined,
  tags: [],
  status: "draft",
  publishedAt: undefined,
  seoTitle: undefined,
  seoDescription: undefined,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BlogPostEditorForm({
  mode,
  postId,
  initialPost,
}: {
  mode: "create" | "edit";
  postId?: string;
  initialPost?: BlogPost;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<BlogPost>(initialPost ?? BLANK_POST);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [savedPostId, setSavedPostId] = useState(postId);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof BlogPost>(key: K, value: BlogPost[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function setTitle(value: string) {
    setDraft((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  }

  async function handleSave(status: BlogPost["status"]) {
    setSaving(true);
    setErrors({});

    const payload = {
      ...draft,
      status,
      tags: draft.tags.map((t) => t.trim()).filter(Boolean),
      publishedAt: status === "published" ? (draft.publishedAt ?? new Date().toISOString()) : draft.publishedAt,
    };
    const result = await saveBlogPost(payload, savedPostId);

    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      return;
    }

    if (mode === "create") {
      router.replace(`/admin/blog/${result.postId}`);
    }
    setSavedPostId(result.postId);
    setDraft(payload);
    setSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="Post">
        <div className="space-y-4">
          <Field label="Title" error={errors.title}>
            <input
              value={draft.title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field label="Slug" hint="/blog/…" error={errors.slug}>
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
              rows={10}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field label="Hero image">
            <div className="flex items-center gap-3">
              {draft.heroImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.heroImage} alt="" className="h-16 w-16 rounded-lg object-cover" />
              )}
              <ImageUploadButton
                label={draft.heroImage ? "Replace image" : "Upload image"}
                folder="blog"
                onUploaded={(urls) => set("heroImage", urls[0])}
              />
            </div>
          </Field>
          <Field label="Tags" hint="One per line">
            <textarea
              value={draft.tags.join("\n")}
              onChange={(e) => set("tags", e.target.value.split("\n"))}
              rows={3}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
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
