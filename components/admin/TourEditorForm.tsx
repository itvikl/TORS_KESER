"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  Departure,
  ItineraryDay,
  Staff,
  Tour,
  TourDocument,
  TourInfoCard,
  TourInfoField,
  TourStatus,
} from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";
import { getPublishChecklist, isReadyToPublish } from "@/lib/validation/tourChecklist";
import { saveTour } from "@/lib/actions/tours";
import DuplicateTourButton from "@/components/admin/DuplicateTourButton";
import PdfUploadButton from "@/components/admin/PdfUploadButton";
import ImageField, { ImageGalleryField } from "@/components/admin/ImageField";
import { useConfirm, useDirtyDraft, useToast } from "@/components/admin/feedback/AdminFeedbackProvider";
import UnsavedIndicator from "@/components/admin/feedback/UnsavedIndicator";
import RequiredMark from "@/components/admin/RequiredMark";
import { DEFAULT_CANCELLATION_POLICY_TEXT } from "@/lib/cancellationPolicy";
import { formatUsd, singleSupplementOf } from "@/lib/pricing";

const BLANK_TOUR: Tour = {
  tourId: "",
  slug: "",
  slugHistory: [],
  title: "",
  summary: "",
  description: "",
  heroImage: "",
  gallery: [],
  countries: [],
  travelStyle: "land",
  themeTags: [],
  durationDays: 7,
  minGroupSize: 10,
  flightsIncluded: false,
  isSpecialOffer: false,
  inclusions: [],
  exclusions: [],
  importantToKnow: [],
  infoCards: [],
  pricing: {
    pricePerPersonDouble: 0,
    pricePerPersonSingle: 0,
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
  cancellationPolicy: DEFAULT_CANCELLATION_POLICY_TEXT,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Moves the legacy importantToKnow list into its own info card, so it's edited like any other card. */
function withInfoCards(tour: Tour): Tour {
  const legacy = (tour.importantToKnow ?? []).filter((item) => item.trim());
  if (legacy.length === 0) return { ...tour, infoCards: tour.infoCards ?? [] };
  const card: TourInfoCard = {
    cardId: crypto.randomUUID(),
    title: "Important to Know",
    fields: [],
    items: legacy,
  };
  return { ...tour, importantToKnow: [], infoCards: [card, ...(tour.infoCards ?? [])] };
}

function newInfoField(): TourInfoField {
  return { fieldId: crypto.randomUUID(), label: "", value: "" };
}

function cleanFields(fields: TourInfoField[]): TourInfoField[] {
  return fields
    .map((f) => ({ ...f, label: f.label.trim(), value: f.value.trim() }))
    .filter((f) => f.label || f.value);
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
    importantToKnow: clean(tour.importantToKnow ?? []),
    kashrutDetails: {
      ...tour.kashrutDetails,
      title: tour.kashrutDetails.title?.trim() || undefined,
      extraFields: cleanFields(tour.kashrutDetails.extraFields ?? []),
    },
    infoCards: (tour.infoCards ?? []).map((card) => ({
      ...card,
      title: card.title.trim(),
      fields: cleanFields(card.fields),
      notes: card.notes?.trim() || undefined,
      items: clean(card.items),
    })),
    documents: (tour.documents ?? []).map((doc) => ({ ...doc, title: doc.title.trim() })),
    itineraryDays: tour.itineraryDays.map((day, index) => ({
      ...day,
      dayNumber: index + 1,
      meals: clean(day.meals),
      attractions: clean(day.attractions ?? []),
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
  guides = [],
}: {
  mode: "create" | "edit";
  tourId?: string;
  initialTour?: Tour;
  departures?: Departure[];
  guides?: Staff[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Tour>(() =>
    initialTour
      ? withInfoCards({
          ...initialTour,
          cancellationPolicy: initialTour.cancellationPolicy ?? DEFAULT_CANCELLATION_POLICY_TEXT,
        })
      : BLANK_TOUR
  );
  const [savedTourId, setSavedTourId] = useState<string | undefined>(tourId);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const toast = useToast();
  const confirm = useConfirm();
  const { isDirty, markSaved } = useDirtyDraft(draft);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameReady = useRef(false);

  const cleaned = useMemo(() => cleanTour(draft), [draft]);
  const checklist = useMemo(() => getPublishChecklist(cleaned), [cleaned]);
  const readyToPublish = useMemo(() => isReadyToPublish(cleaned), [cleaned]);
  const missing = useMemo(() => checklist.filter((item) => !item.ok), [checklist]);
  const isPublished = draft.status === "published";
  const isArchived = draft.status === "archived";
  const blockedWhat = isPublished ? "save changes" : "publish";
  // Set when someone clicks Publish while it is blocked: from then on every
  // missing field says so, instead of the button silently doing nothing.
  const [showMissing, setShowMissing] = useState(false);

  /** Props for a field the publish checklist requires: asterisk, id to scroll to, and the "missing" flag. */
  function req(key: string) {
    return { required: true, fieldKey: key, flagged: showMissing && missing.some((item) => item.key === key) };
  }

  // Publishing — or saving changes to a tour that is already live — needs the
  // checklist, so a live tour can never be left incomplete (e.g. no deposit).
  function handleGuardedSave(status?: TourStatus) {
    if (readyToPublish) {
      handleSave(status);
      return;
    }
    setShowMissing(true);
    document.getElementById(`field-${missing[0].key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Taking a live tour offline is its own deliberate action, never a side
  // effect of saving.
  async function handleUnpublish() {
    const ok = await confirm({
      title: "Unpublish this tour?",
      description: "It will disappear from the site, and its page will show “not found” until you publish it again.",
      confirmLabel: "Unpublish",
      tone: "danger",
    });
    if (ok) handleSave("draft");
  }

  function postPreview() {
    if (!frameReady.current) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "tour-preview-update", tour: cleaned, departures, guides },
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
  }, [cleaned, departures, guides]);

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
      attractions: [],
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

  const infoCards = draft.infoCards ?? [];

  function setInfoCards(cards: TourInfoCard[]) {
    set("infoCards", cards);
  }

  function addInfoCard() {
    setInfoCards([...infoCards, { cardId: crypto.randomUUID(), title: "", fields: [], items: [] }]);
  }

  function updateInfoCard(cardId: string, patch: Partial<TourInfoCard>) {
    setInfoCards(infoCards.map((c) => (c.cardId === cardId ? { ...c, ...patch } : c)));
  }

  function moveInfoCard(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= infoCards.length) return;
    const next = [...infoCards];
    [next[index], next[target]] = [next[target], next[index]];
    setInfoCards(next);
  }

  function removeInfoCard(cardId: string) {
    setInfoCards(infoCards.filter((c) => c.cardId !== cardId));
  }

  const documents = draft.documents ?? [];

  function setDocuments(next: TourDocument[]) {
    set("documents", next);
  }

  function addDocuments(files: { url: string; fileName: string }[]) {
    setDocuments([
      ...documents,
      ...files.map((file) => ({
        documentId: crypto.randomUUID(),
        // "Costa-Rica-8-days-ECSR.pdf" -> "Costa Rica 8 days ECSR": a readable title to start from, editable below.
        title: file.fileName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim(),
        url: file.url,
        fileName: file.fileName,
      })),
    ]);
  }

  function updateDocumentTitle(documentId: string, title: string) {
    setDocuments(documents.map((d) => (d.documentId === documentId ? { ...d, title } : d)));
  }

  function moveDocument(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= documents.length) return;
    const next = [...documents];
    [next[index], next[target]] = [next[target], next[index]];
    setDocuments(next);
  }

  function removeDocument(documentId: string) {
    setDocuments(documents.filter((d) => d.documentId !== documentId));
  }

  async function handleSave(status?: TourStatus) {
    const wasPublished = draft.status === "published";
    setSaving(true);
    setErrors({});

    const payload: Tour = status ? { ...cleaned, status } : cleaned;
    let result;
    try {
      result = await saveTour(payload, savedTourId);
    } catch {
      setSaving(false);
      toast.error({ title: "Save failed", description: "Something went wrong on the server — please try again." });
      return;
    }

    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      const count = Object.values(result.errors).filter(Boolean).length;
      toast.error({
        title: "Tour not saved",
        description: `${count} field${count === 1 ? " needs" : "s need"} attention — check the highlighted fields.`,
      });
      return;
    }

    if (status) set("status", status);
    markSaved(status ? { ...draft, status } : draft);
    setSavedTourId(result.tourId);
    setSavedAt(new Date());
    setSaving(false);
    toast.success(
      status === "published"
        ? { title: "Tour published", description: `"${payload.title}" is now live on the site.` }
        : status === "draft" && wasPublished
          ? { title: "Tour unpublished", description: `"${payload.title}" is no longer on the site.` }
        : mode === "create"
          ? { title: "Tour created", description: "Saved as a draft — you can keep editing." }
          : { title: "Changes saved", description: `"${payload.title}" was saved successfully.` }
    );

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
          {savedTourId && <DuplicateTourButton tourId={savedTourId} />}
        </div>

        <PublishChecklist items={checklist} />

        <div className="space-y-8">
          <Section title="Basics">
            <Field label="Title" {...req("title")} error={errors.title}>
              <input
                className={inputClass}
                value={draft.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </Field>
            <Field label="Slug" hint="/tours/…" {...req("slug")} error={errors.slug}>
              <input
                className={inputClass}
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="Summary" {...req("summary")} error={errors.summary}>
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
            <Field
              label="Countries"
              hint="Ctrl/Cmd-click to select multiple"
              {...req("countries")}
              error={errors.countries}
            >
              <select
                multiple
                size={8}
                className={inputClass}
                value={draft.countries}
                onChange={(e) =>
                  set(
                    "countries",
                    Array.from(e.target.selectedOptions, (option) => option.value)
                  )
                }
              >
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
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
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={draft.isSpecialOffer ?? false}
                onChange={(e) => set("isSpecialOffer", e.target.checked)}
              />
              Special Offer — feature this tour on the Special Offers page
            </label>
            <p className="text-xs text-ink-muted">
              Booking assurance (Conditional / Guaranteed) is now set per departure date — see the
              Departures screen for this tour.
            </p>
          </Section>

          <Section title="Photos">
            <Field label="Hero image" {...req("heroImage")} error={errors.heroImage}>
              <ImageField
                shape="wide"
                value={draft.heroImage || undefined}
                onChange={(url) => set("heroImage", url ?? "")}
              />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Gallery</p>
              <ImageGalleryField values={draft.gallery} onChange={(urls) => set("gallery", urls)} />
            </div>
          </Section>

          <Section title="Downloads (PDF)">
            <p className="text-xs text-ink-muted">
              Itineraries or brochures visitors can download from the tour page. PDF only, up to 9MB each.
            </p>
            {documents.length > 0 && (
              <ul className="space-y-3">
                {documents.map((doc, index) => (
                  <li key={doc.documentId} className="rounded-lg border border-line p-3">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <input
                          className={inputClass}
                          value={doc.title}
                          placeholder="Title shown to visitors"
                          aria-label={`Title for ${doc.fileName}`}
                          onChange={(e) => updateDocumentTitle(doc.documentId, e.target.value)}
                        />
                        {errors[`documents.${index}.title`]?.map((message) => (
                          <p key={message} className="mt-1 text-xs font-medium text-terracotta-dark">
                            {message}
                          </p>
                        ))}
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block truncate text-xs text-ink-muted underline hover:text-ink"
                        >
                          {doc.fileName}
                        </a>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveDocument(index, -1)}
                          aria-label="Move up"
                          className="rounded px-1.5 text-sm text-ink-muted hover:text-ink disabled:opacity-30 disabled:hover:text-ink-muted"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={index === documents.length - 1}
                          onClick={() => moveDocument(index, 1)}
                          aria-label="Move down"
                          className="rounded px-1.5 text-sm text-ink-muted hover:text-ink disabled:opacity-30 disabled:hover:text-ink-muted"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.documentId)}
                          className="ms-1 rounded px-1.5 text-xs font-semibold text-terracotta-dark hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <PdfUploadButton label={documents.length > 0 ? "Upload another PDF" : "Upload PDF"} onUploaded={addDocuments} />
          </Section>

          <Section title="Pricing & policy">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price / person (double)" {...req("pricePerPersonDouble")}>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.pricing.pricePerPersonDouble}
                  onChange={(e) => setPricing("pricePerPersonDouble", Number(e.target.value))}
                />
              </Field>
              <Field
                label="Price / person (single)"
                hint={`the full price for a private room, not an add-on · supplement +${formatUsd(singleSupplementOf(draft.pricing))}`}
              >
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.pricing.pricePerPersonSingle}
                  onChange={(e) => setPricing("pricePerPersonSingle", Number(e.target.value))}
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
              <Field label="Deposit / person" hint="0 = no deposit required">
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
            <Field
              label="Cancellation policy"
              hint="shown on the tour page, one term per line — display only, doesn't change refund calculations"
            >
              <textarea
                className={inputClass}
                rows={6}
                value={draft.cancellationPolicy ?? ""}
                onChange={(e) => set("cancellationPolicy", e.target.value)}
              />
            </Field>
            <button
              type="button"
              onClick={() => set("cancellationPolicy", DEFAULT_CANCELLATION_POLICY_TEXT)}
              className="text-xs font-medium text-navy hover:text-navy-light"
            >
              Reset to the standard policy
            </button>
          </Section>

          <Section title="Kashrut card">
            <Field label="Card title" hint="blank shows “Kashrut”">
              <input
                className={inputClass}
                placeholder="Kashrut"
                value={draft.kashrutDetails.title ?? ""}
                onChange={(e) => setKashrut("title", e.target.value)}
              />
            </Field>
            <Field label="Supervision level" {...req("supervisionLevel")} error={errors["kashrutDetails.supervisionLevel"]}>
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
            <Field label="Notes" hint="optional — blank lines start a new paragraph">
              <textarea
                className={inputClass}
                rows={5}
                value={draft.kashrutDetails.notes ?? ""}
                onChange={(e) => setKashrut("notes", e.target.value)}
              />
            </Field>
            <InfoFieldsEditor
              label="More sub-titles"
              fields={draft.kashrutDetails.extraFields ?? []}
              onChange={(fields) => setKashrut("extraFields", fields)}
            />
          </Section>

          <Section title="More info cards">
            <p className="text-xs text-ink-muted">
              Each card appears on the tour page after the Kashrut card, in this order.
            </p>
            <div className="space-y-4">
              {infoCards.map((card, index) => (
                <InfoCardEditor
                  key={card.cardId}
                  card={card}
                  index={index}
                  count={infoCards.length}
                  titleError={errors[`infoCards.${index}.title`]}
                  onChange={(patch) => updateInfoCard(card.cardId, patch)}
                  onMove={(delta) => moveInfoCard(index, delta)}
                  onRemove={() => removeInfoCard(card.cardId)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addInfoCard}
              className="rounded-lg border border-dashed border-line px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-navy hover:text-navy"
            >
              + Add card
            </button>
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

          <Section title="Itinerary" {...req("itinerary")}>
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
            {isDirty && <span className="ms-2"><UnsavedIndicator /></span>}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex gap-2">
              {/* Left button depends on the tour's state: a live tour is never un-published by a save. */}
              {isPublished ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleUnpublish}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand-warm disabled:opacity-60"
                >
                  Unpublish
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => (isArchived ? handleSave() : handleSave("draft"))}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand-warm disabled:opacity-60"
                >
                  {isArchived ? "Save changes" : "Save draft"}
                </button>
              )}
              {/* aria-disabled rather than disabled: a blocked click scrolls to the first missing field instead of doing nothing. */}
              <button
                type="button"
                disabled={saving}
                aria-disabled={!readyToPublish}
                aria-describedby={!readyToPublish ? "publish-blocked-reason" : undefined}
                title={!readyToPublish ? `Can't ${blockedWhat} yet — missing: ${missing.map((m) => m.label).join(", ")}` : undefined}
                onClick={() => handleGuardedSave(isPublished ? undefined : "published")}
                className={`rounded-lg bg-olive px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-40 ${
                  readyToPublish ? "hover:opacity-90" : "cursor-not-allowed opacity-40"
                }`}
              >
                {saving ? "Saving…" : isPublished ? "Save changes" : "Publish"}
              </button>
            </div>
            {!readyToPublish && (
              <p id="publish-blocked-reason" className="max-w-md text-right text-xs font-medium text-terracotta-dark">
                Can&apos;t {blockedWhat} yet — missing: {missing.map((m) => m.label).join(", ")}.
                {isPublished && " A live tour must stay complete; fill these in, or unpublish it to save as a draft."}
              </p>
            )}
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

function Section({
  title,
  children,
  required,
  fieldKey,
  flagged,
}: {
  title: string;
  children: React.ReactNode;
  required?: boolean;
  fieldKey?: string;
  flagged?: boolean;
}) {
  return (
    <section
      id={fieldKey ? `field-${fieldKey}` : undefined}
      className={`rounded-xl border bg-white p-5 ${flagged ? "border-terracotta" : "border-line"}`}
    >
      <h2 className="mb-4 text-base font-bold text-ink">
        {title}
        {required && <RequiredMark />}
      </h2>
      <div className="space-y-4">{children}</div>
      {flagged && <p className="mt-3 text-xs font-medium text-terracotta-dark">Required to publish</p>}
    </section>
  );
}


function Field({
  label,
  hint,
  error,
  required,
  fieldKey,
  flagged,
  children,
}: {
  label: string;
  hint?: string;
  error?: string[];
  /** Needed before the tour can be published — shown with an asterisk. */
  required?: boolean;
  /** Anchor id (`field-<fieldKey>`) the Publish button scrolls to when this is missing. */
  fieldKey?: string;
  /** Required and still empty after a blocked Publish click. */
  flagged?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div id={fieldKey ? `field-${fieldKey}` : undefined}>
      <label
        className={`mb-1.5 flex items-baseline justify-between text-sm font-medium ${
          flagged ? "text-terracotta-dark" : "text-ink"
        }`}
      >
        <span>
          {label}
          {required && <RequiredMark />}
        </span>
        {hint && <span className="text-xs font-normal text-ink-muted">{hint}</span>}
      </label>
      {children}
      {flagged && <p className="mt-1 text-xs font-medium text-terracotta-dark">Required to publish</p>}
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

function InfoFieldsEditor({
  label,
  fields,
  onChange,
}: {
  label: string;
  fields: TourInfoField[];
  onChange: (fields: TourInfoField[]) => void;
}) {
  function update(fieldId: string, patch: Partial<TourInfoField>) {
    onChange(fields.map((f) => (f.fieldId === fieldId ? { ...f, ...patch } : f)));
  }
  return (
    <Field label={label} hint="sub-title + text, like Pat Yisrael">
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.fieldId} className="flex items-start gap-2">
            <input
              className={`${inputClass} sm:max-w-[40%]`}
              placeholder="Sub-title"
              value={field.label}
              onChange={(e) => update(field.fieldId, { label: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Text"
              value={field.value}
              onChange={(e) => update(field.fieldId, { value: e.target.value })}
            />
            <button
              type="button"
              onClick={() => onChange(fields.filter((f) => f.fieldId !== field.fieldId))}
              className="shrink-0 px-2 py-2 text-xs font-semibold text-terracotta-dark hover:underline"
              aria-label="Remove sub-title"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...fields, newInfoField()])}
          className="text-xs font-medium text-navy hover:text-navy-light"
        >
          + Add sub-title
        </button>
      </div>
    </Field>
  );
}

function InfoCardEditor({
  card,
  index,
  count,
  titleError,
  onChange,
  onMove,
  onRemove,
}: {
  card: TourInfoCard;
  index: number;
  count: number;
  titleError?: string[];
  onChange: (patch: Partial<TourInfoCard>) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  const moveClass =
    "rounded px-1.5 text-sm text-ink-muted hover:text-ink disabled:opacity-30 disabled:hover:text-ink-muted";
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-navy">{card.title.trim() || `Card ${index + 1}`}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className={moveClass}
            aria-label="Move card up"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
            className={moveClass}
            aria-label="Move card down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-terracotta-dark hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <Field label="Card title" error={titleError}>
          <input
            className={inputClass}
            placeholder="e.g. Important to Know"
            value={card.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
        <InfoFieldsEditor
          label="Sub-titles"
          fields={card.fields}
          onChange={(fields) => onChange({ fields })}
        />
        <Field label="Notes" hint="optional — blank lines start a new paragraph">
          <textarea
            className={inputClass}
            rows={3}
            value={card.notes ?? ""}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </Field>
        <ListTextarea
          label="Bullet points (one per line)"
          value={card.items}
          onChange={(items) => onChange({ items })}
        />
      </div>
    </div>
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
        <input
          className={inputClass}
          placeholder="Attractions (comma-separated)"
          value={(day.attractions ?? []).join(", ")}
          onChange={(e) =>
            onChange({ attractions: e.target.value.split(",").map((s) => s.trim()) })
          }
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
