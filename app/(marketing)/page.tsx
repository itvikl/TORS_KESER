import Link from "next/link";
import { Suspense } from "react";
import DestinationSearch from "@/components/marketing/DestinationSearch";
import FeaturedToursGrid from "@/components/marketing/FeaturedToursGrid";
import { TourFilterProvider } from "@/components/marketing/TourFilterProvider";
import {
  getAllTours,
  getDeparturesForTour,
  getRegionSearchOptions,
} from "@/lib/data/tours";

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

  const [allTours, regions] = await Promise.all([
    getAllTours(),
    getRegionSearchOptions(),
  ]);

  const toursWithDepartures = await Promise.all(
    allTours.map(async (tour, index) => ({
      tour,
      nextDeparture: (await getDeparturesForTour(tour.tourId))[0],
      image: FEATURED_IMAGES[index % FEATURED_IMAGES.length],
    }))
  );

  return (
    <Suspense fallback={null}>
      <TourFilterProvider
        regions={regions}
        tours={toursWithDepartures}
        initialRegions={initialRegions}
      >
        <div className="overflow-x-hidden bg-[#0a0e1a] text-[#e0e8f0]">
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
              <div className="w-full">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7dd3fc]">
                  Travel the World the Jewish Way
                </p>
                <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
                  Kosher tours to places you&apos;ve
                  <span className="mt-2 block text-[#7dd3fc] [text-shadow:0_0_15px_rgba(125,211,252,0.3)]">
                    wanted to see
                  </span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#a0b4c4] sm:text-xl">
                  Fully escorted, fully kosher journeys worldwide.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="#featured-tours"
                    className="rounded-full bg-[#7dd3fc] px-7 py-3 text-sm font-bold text-[#001f2e] transition hover:brightness-110 active:scale-95"
                  >
                    Explore Tours
                  </a>
                  <Link
                    href="/custom-made-tours"
                    className="rounded-full border border-white/35 bg-white/10 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Plan a Custom Trip
                  </Link>
                </div>
              </div>

              <div className="mt-12 w-full max-w-3xl">
                <DestinationSearch />
              </div>
            </div>
          </section>

          <section
            id="featured-tours"
            className="scroll-mt-24 bg-[#0a0e1a] px-4 py-20 text-[#e0e8f0] sm:px-6 lg:px-8"
          >
            <div className="mx-auto max-w-7xl">
              <FeaturedToursGrid />
            </div>
          </section>

          <section className="bg-[#0f1524] px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
              <TrustSignal
                title="Kashrut You Can Trust"
                body="Every tour travels with a company mashgiach in addition to local rabbinic supervision — not just a promise, a person."
              />
              <TrustSignal
                title="Guided Every Step"
                body="A Shomer Shabbat, English-speaking guide accompanies the group from arrival to departure."
              />
              <TrustSignal
                title="24/7 Support"
                body="Questions before you go, or while you're there — call anytime, day or night."
              />
            </div>
          </section>

          <section className="bg-[#0a0e1a] px-4 py-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl rounded-[3rem] border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] p-10 text-center shadow-2xl backdrop-blur-lg md:p-20">
              <h2 className="font-display text-3xl font-bold text-[#e0e8f0] sm:text-4xl md:text-5xl">
                Design Your Own{" "}
                <span className="text-[#7dd3fc]">Masterpiece Journey</span>
              </h2>
              <p className="mx-auto mt-8 max-w-2xl text-xl leading-8 text-[#a0b4c4]">
                From destination planning to kashrut details, we shape every step of the trip around your family&apos;s priorities and the experience you want to have.
              </p>
              <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/custom-made-tours"
                  className="rounded-full bg-[#7dd3fc] px-10 py-4 text-sm font-bold text-[#001f2e] transition hover:brightness-110 active:scale-95"
                >
                  Start a Custom Plan
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-white/10 bg-white/5 px-10 py-4 text-sm font-bold text-[#e0e8f0] transition hover:bg-white/10"
                >
                  Contact Our Team
                </Link>
              </div>
            </div>
          </section>
        </div>
      </TourFilterProvider>
    </Suspense>
  );
}

function TrustSignal({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] p-8 text-center shadow-2xl backdrop-blur-lg transition-all duration-300 hover:border-[rgba(125,211,252,0.2)] hover:bg-[rgba(15,21,36,0.75)]">
      <h3 className="text-xl font-bold text-[#e0e8f0]">{title}</h3>
      <p className="mt-3 text-[15px] leading-7 text-[#a0b4c4]">{body}</p>
    </div>
  );
}
