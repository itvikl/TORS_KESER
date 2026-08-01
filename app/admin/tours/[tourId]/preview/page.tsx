import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TourPageView from "@/components/marketing/TourPageView";
import { getTourByIdAdmin } from "@/lib/data/admin/tours";
import { getDeparturesForTour } from "@/lib/data/tours";
import { requireAdminSession } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/**
 * "Open Full Preview" (PRD FR-25) — a separate tab showing the exact
 * public-facing render (TourPageView's own "PREVIEW MODE" banner covers
 * the "Not Published" note), reading the last-saved draft. Deliberately
 * outside app/admin/(protected) so it renders without the admin sidebar
 * chrome — it should look like the real page, not an admin screen.
 * requireAdminSession() here is the auth check (proxy.ts also covers
 * everything under /admin, but this route fetches Firestore data itself,
 * so it re-verifies per the Next.js auth guide's defense-in-depth guidance).
 */
export default async function TourFullPreviewPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  await requireAdminSession();

  const { tourId } = await params;
  const tour = await getTourByIdAdmin(tourId);
  if (!tour) notFound();

  const departures = await getDeparturesForTour(tourId);

  return <TourPageView tour={tour} departures={departures} previewMode />;
}
