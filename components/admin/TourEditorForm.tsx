"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Departure, ItineraryDay, Tour, TourStatus } from "@/lib/types";
import { REGIONS } from "@/lib/validation/tour";
import { getPublishChecklist, isReadyToPublish } from "@/lib/validation/tourChecklist";
import { saveTour } from "@/lib/actions/tours";
import ImageUploadButton from "@/components/admin/ImageUploadButton";

const BLANK_TOUR: Tour = {
  tourId: "",
  slug: "",
  slugHistory: [],
  title: "",
  summary: "",
  description: "",
  heroImage: "",
  gallery: [],
  region: REGIONS[0],
  travelStyle: "land",
  themeTags: [],
  durationDays: 7,
  minGroupSize: 10,
  flightsIncluded: false,
  inclusions: [],
  exclusions: [],
  pricing: {
    pricePerPersonDouble: 0,
    singleSupplement: 0,
    depositAmountPerPerson: 0,
    balanceDueDaysBeforeDeparture: 60,
  },
  kashrutDetails: {
    supervisionLevel: "",
    patYisrael: true,
    chalavYisrael: true,
  },
  itineraryDays: [],
  status: "draft",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Trims/drops blank entries — the form keeps raw (possibly-blank) array entries while typing. */
function cleanTour(tour: Tour): Tour {
  const clean = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);
  return {
    ...tour,
    gallery: clean(tour.gallery),
    themeTags: clean(tour.themeTags),
    inclusions: clean(tour.inclusions),
    exclusions: clean(tour.exclusions),
    itineraryDays: tour.itineraryDays.map((day, index) => ({
      ...day,
      dayNumber: index + 1,
      meals: clean(day.meals),
    })),
  };
}

type Viewport = "desktop" | "tablet" | "mobile";
const VIEWPORT_WIDTH: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

export default function TourEditorForm({
  mode,
  tourId,
  initialTour,
  departures = [],
}: {
  mode: "create" | "edit";
  tourId?: string;
  initialTour?: Tour;
  departures?: Departure[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Tour>(initialTour ?? BLANK_TOUR);
  const [savedTourId, setSavedTourId] = useState<string | undefined>(tourId);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameReady = useRef(false);

  const cleaned = useMemo(() => cleanTour(draft), [draft]);
  const checklist = useMemo(() => getPublishChecklist(cleaned), [cleaned]);
  const readyToPublish = useMemo(() => isReadyToPublish(cleaned), [cleaned]);

  function postPreview() {
    if (!frameReady.current) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "tour-preview-update", tour: cleaned, departures },
      window.location.origin
    );
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "tour-preview-frame-ready") return;
      frameReady.current = true;
      postPreview();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    postPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleaned, departures]);

  function set<K extends keyof Tour>(key: K, value: Tour[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function setPricing<K extends keyof Tour["pricing"]>(key: K, value: Tour["pricing"][K]) {
    setDraft((prev) => ({ ...prev, pricing: { ...prev.pricing, [key]: value } }));
  }

  function setKashrut<K extends keyof Tour["kashrutDetails"]>(
    key: K,
    value: Tour["kashrutDetails"][K]
  ) {
    setDraft((prev) => ({ ...prev, kashrutDetails: { ...prev.kashrutDetails, [key]: value } }));
  }

  function handleTitleChange(value: string) {
    setDraft((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  }

  function addItineraryDay() {
    const day: ItineraryDay = {
      dayId: crypto.randomUUID(),
      dayNumber: draft.itineraryDays.length + 1,
      title: "",
      description: "",
      meals: [],
    };
    set("itineraryDays", [...draft.itineraryDays, day]);
  }

  function updateItineraryDay(dayId: string, patch: Partial<ItineraryDay>) {
    set(
      "itineraryDays",
      draft.itineraryDays.map((d) => (d.dayId === dayId ? { ...d, ...patch } : d))
    );
  }

  function removeItineraryDay(dayId: string) {
    set(
      "itineraryDays",
      draft.itineraryDays.filter((d) => d.dayId !== dayId)
    );
  }

  async function handleSave(status?: TourStatus) {
    setSaving(true);
    setErrors({});

    const payload: Tour = status ? { ...cleaned, status } : cleaned;
    const result = await saveTour(payload, savedTourId);

    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      return;
    }

    if (status) set("status", status);
    setSavedTourId(result.tourId);
    setSavedAt(new Date());
    setSaving(false);

    if (mode === "create") {
      router.replace(`/admin/tours/${result.tourId}`);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Form column */}
      <div>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/admin/tours" className="text-sm font-medium text-ink-muted hover:text-ink">
              ← Tours
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              {mode === "create" ? "New tour" : draft.title || "Untitled tour"}
            </h1>
          </div>
        </div>

        <PublishChecklist items={checklist} />

        <div className="space-y-8">
          <Section title="Basics">
            <Field label="Title" error={errors.title}>
              <input
                className={inputClass}
                value={draft.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </Field>
            <Field label="Slug" hint="/tours/…" error={errors.slug}>
              <input
                className={inputClass}
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="Summary" error={errors.summary}>
              <textarea
                className={inputClass}
                rows={2}
                value={draft.summary}
                onChange={(e) => set("summary", e.target.value)}
              />
            </Field>
            <Field label="Full description">
              <textarea
                className={inputClass}
                rows={5}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Region" error={errors.region}>
                <select
                  className={inputClass}
                  value={draft.region}
                  onChange={(e) => set("region", e.target.value)}
                >
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Travel style">
                <select
                  className={inputClass}
                  value={draft.travelStyle}
                  onChange={(e) => set("travelStyle", e.target.value as Tour["travelStyle"])}
                >
                  <option value="land">Land</option>
                  <option value="luxury">Luxury</option>
                  <option value="cruise">Cruise</option>
                  <option value="seminar">Seminar</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Duration (days)" error={errors.durationDays}>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={draft.durationDays}
                  onChange={(e) => set("durationDays", Number(e.target.value))}
                />
              </Field>
              <Field label="Minimum group size">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.minGroupSize}
                  onChange={(e) => set("minGroupSize", Number(e.target.value))}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={draft.flightsIncluded}
                onChange={(e) => set("flightsIncluded", e.target.checked)}
              />
              Flights included
            </label>
          </Section>

          <Section title="Photos">
            <Field label="Hero image URL" error={errors.heroImage}>
              <div className="flex items-start gap-3">
                <input
                  className={inputClass}
                  value={draft.heroImage}
                  onChange={(e) => set("heroImage", e.target.value)}
                />
                <ImageUploadButton
                  label="Upload"
                  onUploaded={([url]) => set("heroImage", url)}
                />
              </div>
              {draft.heroImage && (
                // eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail, not public-facing content
                <img
                  src={draft.heroImage}
                  alt=""
                  className="mt-2 h-24 w-40 rounded-lg object-cover"
                />
              )}
            </Field>
            <div>
              <ListTextarea
                label="Gallery image URLs (one per line)"
                value={draft.gallery}
                onChange={(v) => set("gallery", v)}
              />
              <div className="mt-2 flex items-center gap-3">
                <ImageUploadButton
                  label="Upload gallery images"
                  multiple
                  onUploaded={(urls) => set("gallery", [...draft.gallery, ...urls])}
                />
              </div>
              {draft.gallery.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {draft.gallery.map((src, index) => (
                    // eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail, not public-facing content
                    <img
                      key={`${src}-${index}`}
                      src={src}
                      alt=""
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section title="Pricing & policy">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price / person (double)">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.pricing.pricePerPersonDouble}
                  onChange={(e) => setPricing("pricePerPersonDouble", Number(e.target.value))}
                />
              </Field>
              <Field label="Single supplement">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.pricing.singleSupplement}
                  onChange={(e) => setPricing("singleSupplement", Number(e.target.value))}
                />
              </Field>
              <Field label="Price / person (triple)" hint="optional">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.pricing.pricePerPersonTriple ?? ""}
                  onChange={(e) =>
                    setPricing(
                      "pricePerPersonTriple",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              </Field>
              <Field label="Child price" hint="optional">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.pricing.childPrice ?? ""}
                  onChange={(e) =>
                    setPricing("childPrice", e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Deposit / person">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.pricing.depositAmountPerPerson}
                  onChange={(e) => setPricing("depositAmountPerPerson", Number(e.target.value))}
                />
              </Field>
              <Field label="Balance due (days before)">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.pricing.balanceDueDaysBeforeDeparture}
                  onChange={(e) =>
                    setPricing("balanceDueDaysBeforeDeparture", Number(e.target.value))
                  }
                />
              </Field>
            </div>
          </Section>

          <Section title="Kashrut & need to know">
            <Field label="Supervision level" error={errors["kashrutDetails.supervisionLevel"]}>
              <input
                className={inputClass}
                value={draft.kashrutDetails.supervisionLevel}
                onChange={(e) => setKashrut("supervisionLevel", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pat Yisrael">
                <KashrutSelect
                  value={draft.kashrutDetails.patYisrael}
                  onChange={(v) => setKashrut("patYisrael", v)}
                />
              </Field>
              <Field label="Chalav Yisrael">
                <KashrutSelect
                  value={draft.kashrutDetails.chalavYisrael}
                  onChange={(v) => setKashrut("chalavYisrael", v)}
                />
              </Field>
            </div>
            <Field label="Notes" hint="optional">
              <textarea
                className={inputClass}
                rows={2}
                value={draft.kashrutDetails.notes ?? ""}
                onChange={(e) => setKashrut("notes", e.target.value)}
              />
            </Field>
          </Section>

          <Section title="Included / not included">
            <ListTextarea
              label="Inclusions (one per line)"
              value={draft.inclusions}
              onChange={(v) => set("inclusions", v)}
            />
            <ListTextarea
              label="Exclusions (one per line)"
              value={draft.exclusions}
              onChange={(v) => set("exclusions", v)}
            />
            <ListTextarea
              label="Theme tags (one per line)"
              value={draft.themeTags}
              onChange={(v) => set("themeTags", v)}
            />
          </Section>

          <Section title="Itinerary">
            <div className="space-y-4">
              {draft.itineraryDays.map((day, index) => (
                <ItineraryDayEditor
                  key={day.dayId}
                  day={day}
                  index={index}
                  onChange={(patch) => updateItineraryDay(day.dayId, patch)}
                  onRemove={() => removeItineraryDay(day.dayId)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addItineraryDay}
              className="mt-3 rounded-lg border border-dashed border-line px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-navy hover:text-navy"
            >
              + Add day
            </button>
          </Section>

          <Section title="SEO">
            <Field label="SEO title" hint="optional — defaults to tour title">
              <input
                className={inputClass}
                value={draft.seoTitle ?? ""}
                onChange={(e) => set("seoTitle", e.target.value)}
              />
            </Field>
            <Field label="SEO description" hint="optional — defaults to summary">
              <textarea
                className={inputClass}
                rows={2}
                value={draft.seoDescription ?? ""}
                onChange={(e) => set("seoDescription", e.target.value)}
              />
            </Field>
          </Section>
        </div>

        {/* Save bar */}
        <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-4 rounded-xl border border-line bg-white/95 p-4 backdrop-blur">
          <div className="text-sm">
            <StatusBadge status={draft.status} />
            {savedAt && (
              <span className="ms-2 text-ink-muted">
                Saved {savedAt.toLocaleTimeString("en-US")}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("draft")}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand-warm disabled:opacity-60"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={saving || !readyToPublish}
              title={!readyToPublish ? "Complete the checklist above to publish." : undefined}
              onClick={() => handleSave("published")}
              className="rounded-lg bg-olive px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview column */}
      <div className="xl:sticky xl:top-6 xl:self-start">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-line bg-white p-1">
            {(["desktop", "tablet", "mobile"] as Viewport[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewport(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  viewport === v ? "bg-navy text-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {savedTourId ? (
            <a
              href={`/admin/tours/${savedTourId}/preview`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-navy hover:text-navy-light"
            >
              Open full preview ↗
            </a>
          ) : (
            <span className="text-sm text-ink-muted" title="Save the tour once to enable this.">
              Open full preview ↗
            </span>
          )}
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-[#0a0e1a] shadow-inner">
          <div
            className="mx-auto h-[80vh] overflow-y-auto transition-[width] duration-200"
            style={{ width: VIEWPORT_WIDTH[viewport] }}
          >
            <iframe
              ref={iframeRef}
              src="/admin/preview-frame"
              title="Tour preview"
              className="h-full w-full border-0"
              onLoad={() => {
                frameReady.current = false;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2 text-[15px] text-ink outline-none focus:border-navy";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="mb-4 text-base font-bold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
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
      <label className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
        {label}
        {hint && <span className="text-xs font-normal text-ink-muted">{hint}</span>}
      </label>
      {children}
      {error?.map((message) => (
        <p key={message} className="mt-1 text-xs font-medium text-terracotta-dark">
          {message}
        </p>
      ))}
    </div>
  );
}

function ListTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        className={inputClass}
        rows={4}
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
      />
    </Field>
  );
}

function KashrutSelect({
  value,
  onChange,
}: {
  value: boolean | "not_guaranteed";
  onChange: (value: boolean | "not_guaranteed") => void;
}) {
  const stringValue = value === true ? "true" : value === false ? "false" : "not_guaranteed";
  return (
    <select
      className={inputClass}
      value={stringValue}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "true" ? true : v === "false" ? false : "not_guaranteed");
      }}
    >
      <option value="true">Guaranteed</option>
      <option value="not_guaranteed">Not guaranteed at every destination</option>
      <option value="false">Not offered</option>
    </select>
  );
}

function ItineraryDayEditor({
  day,
  index,
  onChange,
  onRemove,
}: {
  day: ItineraryDay;
  index: number;
  onChange: (patch: Partial<ItineraryDay>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-navy">Day {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-semibold text-terracotta-dark hover:underline"
        >
          Remove
        </button>
      </div>
      <div className="space-y-3">
        <input
          className={inputClass}
          placeholder="Day title"
          value={day.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <textarea
          className={inputClass}
          rows={2}
          placeholder="Description"
          value={day.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Meals (comma-separated)"
            value={day.meals.join(", ")}
            onChange={(e) => onChange({ meals: e.target.value.split(",").map((s) => s.trim()) })}
          />
          <input
            className={inputClass}
            placeholder="Accommodation"
            value={day.accommodation ?? ""}
            onChange={(e) => onChange({ accommodation: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function PublishChecklist({ items }: { items: { label: string; ok: boolean }[] }) {
  return (
    <div className="mb-6 rounded-xl border border-line bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Publish checklist
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        {items.map((item) => (
          <li
            key={item.label}
            className={`flex items-center gap-1.5 ${item.ok ? "text-olive" : "text-ink-muted"}`}
          >
            <span aria-hidden="true">{item.ok ? "✓" : "○"}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

const STATUS_STYLES: Record<TourStatus, string> = {
  draft: "bg-gold/15 text-terracotta-dark",
  published: "bg-olive/15 text-olive",
  archived: "bg-ink-muted/15 text-ink-muted",
};

function StatusBadge({ status }: { status: TourStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
