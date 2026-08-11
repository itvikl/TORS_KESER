import { Suspense } from "react";
import DestinationSearch from "@/components/marketing/DestinationSearch";
import FeaturedToursGrid from "@/components/marketing/FeaturedToursGrid";
import HomeHeroContent from "@/components/marketing/HomeHeroContent";
import HomeTrustSignals from "@/components/marketing/HomeTrustSignals";
import HomeCtaSection from "@/components/marketing/HomeCtaSection";
import { TourFilterProvider } from "@/components/marketing/TourFilterProvider";
import {
  getAllTours,
  getDeparturesForTour,
  getRegionSearchOptions,
} from "@/lib/data/tours";
import { getSiteContent } from "@/lib/data/siteContent";
import { hasPlannedDeparture } from "@/lib/departureAvailability";
import { bySortOrder } from "@/lib/tourSort";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC43Nqq9_0gg6kRS_GIKae0tEB10U5ZlAJjEuQHGrs8j0H7ht2uc37RlfwfEKlREJPzoVwsZKOZ4MiPdxls__wOWt67DM5260igbf_nDkLeJMMJLj92m75BfBj6IO_uNEvaCEUKhrmR5vpXp698p6HQhfoA3dImkRz7ad4-7OVfVIR3pM0882ENZZpbqCTRNoa_VnhoJv4VtUPYaZRIe1DPlg10VFrPE9OvEJKPY-pVxYoMXZTJT1KNPccdWa4XpN5v_ShhrQTfNA";

const FEATURED_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDc7rBnOzPiEmAC_daoXAbzzOeskIw6jL5Rd1ck2GlWGCr9oWa4PjLuViMRp4UL-GM9f1IN2ns2GE3_k77XIUHBqlNKm8R4-EZLXM0VZ8uSecUw87Z6bvtVQQLicP7oG5yNmU1RCB6YYzvLUerYj-W6TK3X-9zXdcsCgyFqcYS6kYVHJfxdxu_UjBKlX9sZ01oUZ8yGxyWAG5uJHM38hooAxDfjPoTz6dOPyGpt-2RX7zAlqGfRJaQ4PMNrvoP9ZwoKFUHeuThEBA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCa4x6Ss99jVsY-xJyTBlCWdBCZaeI9wR4LTQ1nhcZRR3Q9SB_YapCQ-KVGXuLSQrUyh1yR6E1dTGhPKER1MPZFFeDtqakWP8vvejKommhPLQcl4ohHdcvQ6aN8LmJfzTn09jp7h1dLI9UbJGtAhFkIeESd0K7DxMyWl5aRYIBWWhQOggBC97Oq7_u9vtkSA9E3nOknAn_FghThVBaDONCMOrmq5oEn-zhqqdz9mOwYmcnQqpzJMOFbrvq70R-en-3Wp5HUxOkUcw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCqYOxjJyRnKqt2oX-Y4WUfShhMXp5B73snPXKXFTy9h4a-em52vyyh45koyNmpGdHvCTdNCIDG5mwMNHjvvxwW-id9ZSJTDv2JwbonB_QLg0JiG8FW5i8GCIYYjVpNliOUYefN3Vxtm-xQbW8jyTiSCkE5FwYwr79iZvOqp1ScfIxy6MhikFf8Ee9wqKE3Rg0A6F4vev5zM6o43iz3gtbS8xXev2JgA8ml77LzeYdgvNmccqrAyh_q35e4PA5aN4BPQMuAxPKeNw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCmwAwQFGrN_WnvmuAkHWrOQxpOkGZGJF7DMzBoZoaIjVevsSWszJJ596yhKQBpcAt7-JNqUNpVbfPceqWjPfZ2YPSLV1GUCsbA7TMibnCnmqeDHUFaxfFch9MAbuZWGzOet_VKaDNe7w6EZtUSuzgcplWs4sxUl9sjSyp5M0HrkMtA9dy0jFqMaOhqmrQozwPbE7pYho9UIWpKf51UrV_2LixExCNK-AJ55D8sOElPVPxGZ87tPlgo7t5TsnjLm4MTshm8-ceIHA",
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialRegions = (
    Array.isArray(params.region)
      ? params.region
      : params.region
        ? [params.region]
        : []
  ).filter(Boolean);

  const [allTours, regions, content] = await Promise.all([
    getAllTours(),
    getRegionSearchOptions(),
    getSiteContent("home"),
  ]);

  const toursWithAllDepartures = await Promise.all(
    allTours.map(async (tour) => ({
      tour,
      departures: await getDeparturesForTour(tour.tourId),
    }))
  );

  // Tours with no departure planned at all are hidden from the listing/search
  // (but their page stays reachable by direct URL — see /tours/[slug]).
  const toursWithDepartures = toursWithAllDepartures
    .filter(({ departures }) => hasPlannedDeparture(departures))
    .sort((a, b) => bySortOrder(a.tour, b.tour))
    .map(({ tour, departures }, index) => ({
      tour,
      nextDeparture: departures[0],
      // Real tour photo first (set in the admin editor) — the stock photo
      // array is only a last-resort placeholder for tours with no image at
      // all yet (old seed data, or a brand-new draft).
      image: tour.heroImage || tour.gallery[0] || FEATURED_IMAGES[index % FEATURED_IMAGES.length],
    }));

  return (
    <Suspense fallback={null}>
      <TourFilterProvider
        regions={regions}
        tours={toursWithDepartures}
        initialRegions={initialRegions}
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
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(10,14,26,0.25)] to-[rgba(10,14,26,0.85)]" />
            </div>

            <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
              <HomeHeroContent content={content} />

              <div className="mt-12 w-full max-w-3xl">
                <DestinationSearch />
              </div>
            </div>
          </section>

          <section
            id="featured-tours"
            className="scroll-mt-24 bg-[var(--color-glacier)] px-4 py-20 text-[var(--color-mist)] sm:px-6 lg:px-8 transition-colors"
          >
            <div className="mx-auto max-w-7xl">
              <FeaturedToursGrid />
            </div>
          </section>

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
