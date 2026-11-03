import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import TourPageView from "@/components/marketing/TourPageView";
import JsonLd from "@/components/seo/JsonLd";
import {
  getArchivedTourRedirectPath,
  getDeparturesForTour,
  getGuidesForDepartures,
  getTourBySlug,
} from "@/lib/data/tours";
import { getSiteSettings } from "@/lib/data/admin/settings";
import { getApprovedReviewsForTour } from "@/lib/data/reviews";
import { getSiteContent } from "@/lib/data/siteContent";
import { withoutBrandSuffix } from "@/lib/seoTitle";
import { SITE_URL } from "@/lib/siteUrl";

// Rendered on every request, never cached. Departure dates, seats and the
// downloadable PDFs are live data staff change in the admin, and Google's CDN
// in front of App Hosting keeps its own copy of any cacheable page for
// s-maxage and ignores revalidatePath, so a cached page showed some visitors
// an old departure date or an old PDF. A tour page is one small Firestore read.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return {};

  const title = withoutBrandSuffix(tour.seoTitle ?? tour.title);
  const description = tour.seoDescription ?? tour.summary;
  // Canonical is the current slug, so a tour reached by an old slug
  // (slugHistory) doesn't compete with itself in search.
  return {
    title,
    description,
    alternates: { canonical: `/tours/${tour.slug}` },
    openGraph: { title, description, url: `/tours/${tour.slug}`, images: tour.heroImage ? [tour.heroImage] : undefined },
  };
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  // Archived tours are redirected with a real 307 by proxy.ts before this
  // page renders. This is only the fallback for a request that skipped it
  // (e.g. a copy cached while the tour was still published) — from here the
  // redirect can only stream out as a meta refresh, never an HTTP status.
  if (tour.status === "archived") redirect(await getArchivedTourRedirectPath(tour));

  const [departures, settings, testimonials, copy] = await Promise.all([
    getDeparturesForTour(tour.tourId),
    getSiteSettings(),
    getApprovedReviewsForTour(tour),
    getSiteContent("tour-page"),
  ]);
  const guides = await getGuidesForDepartures(departures);

  const url = `${SITE_URL}/tours/${tour.slug}`;
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            name: tour.title,
            description: tour.summary,
            url,
            image: tour.heroImage || undefined,
            touristType: "Kosher-observant travelers",
            provider: { "@type": "TravelAgency", name: "Keshertours", url: SITE_URL },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: tour.title, item: url },
            ],
          },
        ]}
      />
      <TourPageView
        tour={tour}
        departures={departures}
        guides={guides}
        testimonials={testimonials}
        lowSeatsThreshold={settings.lowSeatsThreshold}
        copy={copy}
      />
    </>
  );
}
