/**
 * The tour page's built-in sections that can appear in its sticky secondary
 * navbar (components/marketing/TourSectionNav.tsx). Admins can hide any of
 * them from the navbar per tour (Tour.navHiddenSections) — the section itself
 * still renders on the page. Custom sections carry their own showInNav flag.
 */
export const TOUR_NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "itinerary", label: "Itinerary" },
  { id: "guides", label: "Your Guides" },
  { id: "kashrut", label: "Kashrut & What to Know" },
  { id: "included", label: "What's Included" },
  { id: "testimonials", label: "Testimonials" },
  { id: "cancellation", label: "Cancellation Policy" },
] as const;

export type TourNavSectionId = (typeof TOUR_NAV_SECTIONS)[number]["id"];

export const TOUR_NAV_SECTION_IDS = TOUR_NAV_SECTIONS.map((s) => s.id) as [
  TourNavSectionId,
  ...TourNavSectionId[],
];

/** DOM id (and navbar anchor) of a custom section on the tour page. */
export function customSectionAnchor(sectionId: string): string {
  return `section-${sectionId}`;
}
