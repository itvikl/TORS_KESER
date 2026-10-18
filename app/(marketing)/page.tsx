import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import DestinationSearch from "@/components/marketing/DestinationSearch";
import FeaturedToursGrid from "@/components/marketing/FeaturedToursGrid";
import HomeHeroContent from "@/components/marketing/HomeHeroContent";
import HomeTrustSignals from "@/components/marketing/HomeTrustSignals";
import HomeCtaSection from "@/components/marketing/HomeCtaSection";
import BlogCard from "@/components/marketing/BlogCard";
import { TourFilterProvider } from "@/components/marketing/TourFilterProvider";
import {
  getAllTours,
  getDeparturesForTour,
  getCountrySearchOptions,
} from "@/lib/data/tours";
import { getSiteContent } from "@/lib/data/siteContent";
import { getLatestBlogPosts } from "@/lib/data/blog";
import { isDeparturePlanned } from "@/lib/departureAvailability";
import { bySortOrder } from "@/lib/tourSort";
import {
  HOME_TOURS_CACHE_TAG,
  HOME_CONTENT_CACHE_TAG,
  HOME_BLOG_CACHE_TAG,
} from "@/lib/data/homeCacheTags";

const HERO_IMAGE =
  "https://firebasestorage.googleapis.com/v0/b/kesertors.firebasestorage.app/o/site%2Fstock%2Fhome-hero-a18f8b00.jpg?alt=media&token=e03feebc-914d-423c-8b8b-bd7d3761658c";

const FEATURED_IMAGES = [
  "https://firebasestorage.googleapis.com/v0/b/kesertors.firebasestorage.app/o/site%2Fstock%2Ffeatured-1-7205ff78.jpg?alt=media&token=360c4321-21b6-4372-8d2f-4045624ae212",
  "https://firebasestorage.googleapis.com/v0/b/kesertors.firebasestorage.app/o/site%2Fstock%2Ffeatured-2-ff82052e.jpg?alt=media&token=017f0ebe-5ad1-42ef-8226-be1d9256d61e",
  "https://firebasestorage.googleapis.com/v0/b/kesertors.firebasestorage.app/o/site%2Fstock%2Ffeatured-3-3d7aa00c.jpg?alt=media&token=0004d87c-1962-447d-9813-8e517624ea26",
  "https://firebasestorage.googleapis.com/v0/b/kesertors.firebasestorage.app/o/site%2Fstock%2Ffeatured-4-ee297270.jpg?alt=media&token=d6b29aee-b5ef-46f4-a015-c824e10b5bc4",
];

/**
 * The home page's tours/departures/site-content reads don't depend on
 * `searchParams` (only the client-side country filter does), but were
 * re-run from scratch — including one Firestore read per tour for its
 * departures — on every navigation to "/", including the header's "Tours"
 * link. That round trip was the multi-second delay on that click. Caching
 * it here means only the first hit after a revalidation pays for it;
 * admin writes bust the cache immediately via `revalidateTag` (see
 * lib/data/homeCacheTags.ts), so this doesn't go stale between edits.
 */
const getHomeData = unstable_cache(
  async () => {
    const [allTours, countries, content, latestPosts] = await Promise.all([
      getAllTours(),
      getCountrySearchOptions(),
      getSiteContent("home"),
      getLatestBlogPosts(3),
    ]);

    const toursWithAllDepartures = await Promise.all(
      allTours.map(async (tour) => ({
        tour,
        departures: await getDeparturesForTour(tour.tourId),
      }))
    );

    // Tours with no departure planned at all are hidden from the listing/search
    // (but their page stays reachable by direct URL — see /tours/[slug]).
    // Only upcoming dates are passed on, so the card's "Departs …" and the
    // month filter never use a date that has already gone.
    const toursWithDepartures = toursWithAllDepartures
      .map(({ tour, departures }) => ({ tour, departures: departures.filter(isDeparturePlanned) }))
      .filter(({ departures }) => departures.length > 0)
      .sort((a, b) => bySortOrder(a.tour, b.tour))
      .map(({ tour, departures }, index) => ({
        tour,
        departures,
        // Real tour photo first (set in the admin editor) — the stock photo
        // array is only a last-resort placeholder for tours with no image at
        // all yet (old seed data, or a brand-new draft).
        image: tour.heroImage || tour.gallery[0] || FEATURED_IMAGES[index % FEATURED_IMAGES.length],
      }));

    return { countries, content, toursWithDepartures, latestPosts };
  },
  ["home-page-data"],
  { revalidate: 60, tags: [HOME_TOURS_CACHE_TAG, HOME_CONTENT_CACHE_TAG, HOME_BLOG_CACHE_TAG] }
);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string | string[]; month?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialCountries = (
    Array.isArray(params.country)
      ? params.country
      : params.country
        ? [params.country]
        : []
  ).filter(Boolean);
  const initialMonths = (
    Array.isArray(params.month) ? params.month : params.month ? [params.month] : []
  ).filter(Boolean);

  const { countries, content, toursWithDepartures, latestPosts } = await getHomeData();

  return (
    <Suspense fallback={null}>
      <TourFilterProvider
        countries={countries}
        tours={toursWithDepartures}
        initialCountries={initialCountries}
        initialMonths={initialMonths}
      >
        <div className="overflow-x-hidden bg-[var(--color-glacier)] text-[var(--color-mist)] transition-colors">
          <section className="relative isolate overflow-hidden">
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_IMAGE}
                alt="Luxury travel destination with dramatic coastal views"
                className="h-full w-full scale-125 object-cover object-center"
              />
              <div
                className="absolute inset-0 mix-blend-soft-light [animation:aurora-shift_16s_ease-in-out_infinite]"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, rgba(125,211,252,0.5), rgba(200,160,240,0.35), rgba(125,211,252,0.5))",
                  backgroundSize: "200% 200%",
                }}
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(10,14,26,0.25)] to-[rgba(10,14,26,0.85)]" />
            </div>

            <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
              <HomeHeroContent content={content} />

              <div className="mt-12 w-full max-w-3xl">
                <DestinationSearch />
              </div>

              <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {content.trustSignals.map((signal, index) => (
                  <li
                    key={index}
                    className="glass-panel flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#e0e8f0]"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7dd3fc"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                    {signal.title}
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="#featured-tours"
              aria-label="Scroll to featured tours"
              className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 transition-colors hover:text-white [animation:scroll-cue-bounce_2s_ease-in-out_infinite]"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          </section>

          <section
            id="featured-tours"
            className="scroll-mt-24 bg-[var(--color-glacier)] px-4 py-20 text-[var(--color-mist)] sm:px-6 lg:px-8 transition-colors"
          >
            <div className="mx-auto max-w-7xl">
              <FeaturedToursGrid />
            </div>
          </section>

          {latestPosts.length > 0 && (
            <section className="bg-[var(--color-glacier)] px-4 py-20 sm:px-6 lg:px-8 transition-colors">
              <div className="mx-auto max-w-7xl">
                <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-ice)]">
                      From the Journal
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--color-mist)] sm:text-3xl">
                      Fresh off the road
                    </h2>
                  </div>
                  <Link
                    href="/blog"
                    className="flex items-center gap-1 pb-1 text-sm font-bold text-[var(--color-ice)] transition-all hover:gap-2"
                  >
                    View all posts <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {latestPosts.map((post) => (
                    <BlogCard key={post.postId} post={post} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="bg-[var(--color-glacier-elevated)] px-4 py-20 sm:px-6 lg:px-8 transition-colors">
            <HomeTrustSignals signals={content.trustSignals} />
          </section>

          <section className="bg-[var(--color-glacier)] px-4 py-24 sm:px-6 lg:px-8 transition-colors">
            <HomeCtaSection content={content} />
          </section>
        </div>
      </TourFilterProvider>
    </Suspense>
  );
}
