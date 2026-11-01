import type { Tour } from "@/lib/types";

export interface ChecklistItem {
  /** Matches the editor field id (`field-<key>`) so a missing item can be scrolled to. */
  key: string;
  label: string;
  ok: boolean;
}

/**
 * Publish-readiness checklist (PRD FR-25: "Checklist שלמות לפני פרסום").
 * Pure/sync so the admin editor can re-run it on every keystroke against
 * live form state, not just at submit time.
 */
export function getPublishChecklist(tour: Tour): ChecklistItem[] {
  return [
    { key: "title", label: "Title", ok: tour.title.trim().length > 0 },
    { key: "slug", label: "Slug", ok: tour.slug.trim().length > 0 },
    { key: "summary", label: "Summary", ok: tour.summary.trim().length > 0 },
    { key: "heroImage", label: "Hero image", ok: tour.heroImage.trim().length > 0 },
    { key: "countries", label: "Countries", ok: tour.countries.length > 0 },
    {
      key: "pricePerPersonDouble",
      label: "Price per person (double)",
      ok: tour.pricing.pricePerPersonDouble > 0,
    },
    {
      key: "supervisionLevel",
      label: "Kashrut supervision level",
      ok: tour.kashrutDetails.supervisionLevel.trim().length > 0,
    },
    { key: "itinerary", label: "At least one itinerary day", ok: tour.itineraryDays.length > 0 },
  ];
}

export function isReadyToPublish(tour: Tour): boolean {
  return getPublishChecklist(tour).every((item) => item.ok);
}
