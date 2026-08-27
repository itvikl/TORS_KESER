import type { Tour } from "@/lib/types";

export interface ChecklistItem {
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
    { label: "Title", ok: tour.title.trim().length > 0 },
    { label: "Slug", ok: tour.slug.trim().length > 0 },
    { label: "Summary", ok: tour.summary.trim().length > 0 },
    { label: "Hero image", ok: tour.heroImage.trim().length > 0 },
    { label: "Countries", ok: tour.countries.length > 0 },
    {
      label: "Price per person (double)",
      ok: tour.pricing.pricePerPersonDouble > 0,
    },
    { label: "Deposit amount", ok: tour.pricing.depositAmountPerPerson > 0 },
    {
      label: "Kashrut supervision level",
      ok: tour.kashrutDetails.supervisionLevel.trim().length > 0,
    },
    { label: "At least one itinerary day", ok: tour.itineraryDays.length > 0 },
  ];
}

export function isReadyToPublish(tour: Tour): boolean {
  return getPublishChecklist(tour).every((item) => item.ok);
}
