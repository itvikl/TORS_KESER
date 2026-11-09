"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDirtyDraft, useToast } from "@/components/admin/feedback/AdminFeedbackProvider";
import UnsavedIndicator from "@/components/admin/feedback/UnsavedIndicator";
import { previewBlogBody, saveBlogPost } from "@/lib/actions/blog";
import BlogPostView from "@/components/marketing/BlogPostView";
import { fromDateInputValue, toDateInputValue } from "@/lib/blogDate";
import ImageField from "@/components/admin/ImageField";
import type { BlogPost } from "@/lib/types";
import RequiredMark from "@/components/admin/RequiredMark";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { bodyToHtml } from "@/lib/blogBody";

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
  const [draft, setDraft] = useState<BlogPost>(() =>
    // Posts saved before the rich editor are plain text — open them as HTML paragraphs.
    initialPost ? { ...initialPost, body: bodyToHtml(initialPost.body) } : BLANK_POST
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [savedPostId, setSavedPostId] = useState(postId);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{ bodyHtml: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const toast = useToast();
  const { isDirty, markSaved } = useDirtyDraft(draft);

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

  async function openPreview() {
    setPreviewLoading(true);
    try {
      setPreview({ bodyHtml: await previewBlogBody(draft.body) });
    } catch {
      toast.error({ title: "Preview failed", description: "Something went wrong on the server — please try again." });
    } finally {
      setPreviewLoading(false);
    }
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
    let result;
    try {
      result = await saveBlogPost(payload, savedPostId);
    } catch {
      setSaving(false);
      toast.error({ title: "Save failed", description: "Something went wrong on the server — please try again." });
      return;
    }

    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      toast.error({ title: "Post not saved", description: "Please fix the highlighted fields and try again." });
      return;
    }

    if (mode === "create") {
      router.replace(`/admin/blog/${result.postId}`);
    }
    setSavedPostId(result.postId);
    setDraft(payload);
    markSaved(payload);
    setSaving(false);
    toast.success(
      status === "published"
        ? { title: "Post published", description: "Your changes are now live on the site." }
        : { title: "Draft saved", description: "The post was saved as a draft." }
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="Post">
        <div className="space-y-4">
          <Field label="Title" required error={errors.title}>
            <input
              value={draft.title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field label="Slug" required hint="/blog/…" error={errors.slug}>
            <input
              value={draft.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field
            label="Body"
            required
            hint="Paste from Word or Google Docs to keep headings, bold, lists and links. Add pictures with the Image button."
            error={errors.body}
          >
            <RichTextEditor value={draft.body} onChange={(html) => set("body", html)} />
          </Field>
          <Field label="Hero image">
            <ImageField folder="blog" value={draft.heroImage} onChange={(url) => set("heroImage", url)} />
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

      <Section title="Publishing">
        <Field
          label="Publish date"
          hint="Shown on the post and used to order the blog. Leave empty to use the day you publish."
          error={errors.publishedAt}
        >
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={toDateInputValue(draft.publishedAt)}
              onChange={(e) => set("publishedAt", fromDateInputValue(e.target.value))}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
            {draft.publishedAt && (
              <button
                type="button"
                onClick={() => set("publishedAt", undefined)}
                className="text-sm font-medium text-ink-muted underline-offset-2 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </Field>
      </Section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={previewLoading}
          onClick={openPreview}
          className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sand-warm disabled:opacity-60"
        >
          {previewLoading ? "Opening preview…" : "Preview"}
        </button>
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
        {isDirty && <span className="self-center"><UnsavedIndicator /></span>}
      </div>

      {preview && (
        <PostPreview
          post={{
            ...draft,
            tags: draft.tags.map((t) => t.trim()).filter(Boolean),
            // An unpublished post with no date would get today's on publish.
            publishedAt: draft.publishedAt ?? new Date().toISOString(),
          }}
          bodyHtml={preview.bodyHtml}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

/**
 * Full-screen view of the unsaved draft, drawn with the public page's own
 * component. Links work: links to other sites open in a new tab, and links
 * to our own pages go through the admin's unsaved-changes guard, which asks
 * before leaving when the draft has unsaved edits.
 */
function PostPreview({ post, bodyHtml, onClose }: { post: BlogPost; bodyHtml: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-glacier)]" role="dialog" aria-modal aria-label="Post preview">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2.5">
        <p className="text-sm font-semibold text-ink">
          Preview <span className="font-normal text-ink-muted">— unsaved changes included; not visible to visitors. Hover a link to see its address.</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-navy px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          Close preview
        </button>
      </div>
      <div className="flex-1 overflow-y-auto text-[var(--color-mist)]">
        <BlogPostView post={post} bodyHtml={bodyHtml} backLabel="Back to blog" />
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
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">
        {label}
        {required && <RequiredMark />}
      </label>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-terracotta-dark">{error[0]}</p>}
    </div>
  );
}
