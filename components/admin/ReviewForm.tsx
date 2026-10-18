"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveReview } from "@/lib/actions/reviews";
import ImageUploadButton from "@/components/admin/ImageUploadButton";
import type { Review, Tour } from "@/lib/types";

const BLANK: Review = {
  reviewId: "",
  tourId: "",
  customerName: "",
  rating: undefined,
  photo: undefined,
  body: "",
  status: "approved",
};

export default function ReviewForm({
  tours,
  destinations = [],
  reviewId,
  initialReview,
}: {
  tours: Tour[];
  /** Destinations already in use — suggested in the Destination field. */
  destinations?: string[];
  /** Present when editing an existing review; omitted when creating a new one. */
  reviewId?: string;
  initialReview?: Review;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Review>(
    initialReview ?? { ...BLANK, tourId: tours[0]?.tourId ?? "" }
  );
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Review>(key: K, value: Review[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setErrors({});

    const result = await saveReview(draft, reviewId);
    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      return;
    }

    router.push("/admin/reviews");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-4 rounded-xl border border-line bg-white p-6">
      <Field label="Tour" error={errors.tourId}>
        <select
          value={draft.tourId}
          onChange={(e) => set("tourId", e.target.value)}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        >
          {tours.map((t) => (
            <option key={t.tourId} value={t.tourId}>
              {t.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer name" error={errors.customerName}>
          <input
            value={draft.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          />
        </Field>
        <Field label="Rating" error={errors.rating}>
          <select
            value={draft.rating ?? ""}
            onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="">No rating given</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Destination" error={errors.destination}>
        <input
          value={draft.destination ?? ""}
          onChange={(e) => set("destination", e.target.value || undefined)}
          list="review-destinations"
          placeholder="e.g. China, Spain & Portugal — blank uses the tour's first country"
          maxLength={60}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        />
        <datalist id="review-destinations">
          {destinations.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-ink-muted">
          Groups the letter on the Testimonials page and shows it on tours visiting that destination.
        </p>
      </Field>

      <Field label="Review text" error={errors.body}>
        <textarea
          value={draft.body}
          onChange={(e) => set("body", e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        />
      </Field>

      <Field label="Photo">
        <div className="flex items-center gap-3">
          {draft.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
          )}
          <ImageUploadButton
            label={draft.photo ? "Replace photo" : "Upload photo"}
            folder="reviews"
            onUploaded={(urls) => set("photo", urls[0])}
          />
        </div>
      </Field>

      <Field label="Status">
        <select
          value={draft.status}
          onChange={(e) => set("status", e.target.value as Review["status"])}
          className="w-full max-w-xs rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </Field>

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
      >
        {saving ? "Saving…" : reviewId ? "Save changes" : "Save review"}
      </button>
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
