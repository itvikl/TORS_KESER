import type { Departure, Review, Staff, Tour } from "@/lib/types";
import { availableSeats } from "@/lib/types";
import { isDepartureBookable, isDeparturePlanned } from "@/lib/departureAvailability";
import { DEFAULT_CANCELLATION_POLICY_TEXT } from "@/lib/cancellationPolicy";
import TourSectionNav, { type TourSectionLink } from "@/components/marketing/TourSectionNav";
import TestimonialCard from "@/components/marketing/TestimonialCard";
import { formatUsd } from "@/lib/pricing";
import SafeImage from "@/components/ui/SafeImage";
import TextReveal from "@/components/ui/TextReveal";

/**
 * KashrutDetails.patYisrael/chalavYisrael are each a 3-way value
 * (true | false | "not_guaranteed"), not a boolean — a naive `=== "not_guaranteed"
 * ? ... : "Guaranteed"` ternary silently renders `false` ("Not offered", a
 * real option in the admin editor) as "Guaranteed".
 */
function kashrutStatusLabel(value: boolean | "not_guaranteed"): string {
  if (value === true) return "Guaranteed";
  if (value === "not_guaranteed") return "Not guaranteed at every destination";
  return "Not offered";
}

/**
 * Pure presentational tour page — props only, no data-fetching.
 *
 * This is the component referenced throughout the PRD (section 9, FR-25):
 * the public route `/tours/[slug]` renders it from data fetched via the
 * Firebase Admin SDK, and the admin editor's live-preview pane will
 * render this exact same component fed from in-memory form state. Because
 * both call sites share this one component, the admin's "preview" is
 * never an approximation — it is pixel-for-pixel what a visitor sees.
 *
 * Keep this component free of "use client" and free of data-fetching so
 * it stays usable from both a Server Component tree and a Client
 * Component tree (the admin editor).
 *
 * Visual language: Glacier glassmorphism (stich_files/DESIGN.md + code.html).
 */
export default function TourPageView({
  tour,
  departures,
  guides = [],
  testimonials = [],
  previewMode = false,
  lowSeatsThreshold = 5,
}: {
  tour: Tour;
  departures: Departure[];
  /** Staff records for the guides assigned (Departure.guideId) to this tour's departures. */
  guides?: Staff[];
  /** Approved reviews for this tour's destinations (lib/data/reviews.ts getApprovedReviewsForTour). */
  testimonials?: Review[];
  /** True when rendered inside the admin's preview pane for an unpublished draft. */
  previewMode?: boolean;
  /** At/below this remaining-seats count, the departure pill shows the exact number. Defaults to the site's pre-existing behavior for the preview contexts that don't fetch SiteSettings. */
  lowSeatsThreshold?: number;
}) {
  const upcoming = departures.filter(isDeparturePlanned);
  const guideById = new Map(guides.map((guide) => [guide.staffId, guide]));
  // Only guides leading an upcoming date are shown — past departures' guides aren't relevant to a buyer.
  const upcomingGuides = Array.from(
    new Set(upcoming.map((dep) => dep.guideId).filter((id): id is string => Boolean(id)))
  )
    .map((id) => guideById.get(id))
    .filter((guide): guide is Staff => Boolean(guide));
  const cancellationTerms = (tour.cancellationPolicy?.trim() || DEFAULT_CANCELLATION_POLICY_TEXT)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const hasItinerary = tour.itineraryDays.length > 0;
  const shownTestimonials = testimonials.slice(0, 4);
  const hasInclusions = tour.inclusions.length > 0 || tour.exclusions.length > 0;
  const sections: TourSectionLink[] = [
    { id: "overview", label: "Overview" },
    ...(hasItinerary ? [{ id: "itinerary", label: "Itinerary" }] : []),
    ...(upcomingGuides.length > 0 ? [{ id: "guides", label: "Your Guides" }] : []),
    { id: "kashrut", label: "Kashrut" },
    ...(hasInclusions ? [{ id: "included", label: "What's Included" }] : []),
    ...(shownTestimonials.length > 0 ? [{ id: "testimonials", label: "Testimonials" }] : []),
    { id: "cancellation", label: "Cancellation Policy" },
    { id: "dates", label: "Dates & Booking", mobileOnly: true },
  ];
  const bookHref = (departureId: string) =>
    tour.slug ? `/tours/${tour.slug}/book?departure=${encodeURIComponent(departureId)}` : "#";
  const nights = Math.max(tour.durationDays - 1, 0);
  const badge = tour.themeTags[0] ?? tour.travelStyle;
  const bookingHighlights = [
    tour.flightsIncluded ? "Flights included" : null,
    "Fully kosher program",
    tour.inclusions[0] ?? null,
  ].filter(Boolean) as string[];

  return (
    <article className="bg-[var(--color-glacier)] text-[var(--color-mist)] selection:bg-[var(--color-ice)]/30 transition-colors">
      {previewMode && (
        <div className="bg-[var(--color-lilac)]/20 px-4 py-2 text-center text-sm font-semibold text-[var(--color-lilac)]">
          PREVIEW MODE — Not Published
        </div>
      )}

      <TourHeroGallery
        images={[tour.heroImage, ...tour.gallery].filter(Boolean)}
        alt={tour.title}
        title={tour.title}
        badge={badge}
        countries={tour.countries}
        durationDays={tour.durationDays}
      />

      <TourSectionNav sections={sections} />

      <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:gap-12 lg:px-8 lg:py-16">
        <div className="space-y-14 lg:col-span-2">
          {/* Overview */}
          <div id="overview" className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ice)] sm:text-3xl">
              Overview
            </h2>
            <TextReveal
              text={tour.description || tour.summary}
              className="text-lg leading-relaxed text-[var(--color-slate)]"
            />

            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
              <QuickFact
                icon="schedule"
                label="Duration"
                value={`${tour.durationDays} Days / ${nights} Nights`}
              />
              <QuickFact
                icon="groups"
                label="Group Size"
                value={
                  tour.minGroupSize
                    ? `From ${tour.minGroupSize} travelers`
                    : "Small groups"
                }
              />
              <QuickFact
                icon="public"
                label="Countries"
                value={tour.countries.join(", ")}
              />
            </div>
          </div>

          {/* Itinerary */}
          {hasItinerary && (
            <div id="itinerary" className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ice)] sm:text-3xl">
                Your Journey Day by Day
              </h2>
              <div className="space-y-3">
                {tour.itineraryDays.map((day, index) => (
                  <details
                    key={day.dayId}
                    open={index === 0}
                    className="glass-panel group overflow-hidden rounded-xl"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-[var(--color-surface-hover-a)] sm:p-6 [&::-webkit-details-marker]:hidden">
                      <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                        <span className="shrink-0 text-2xl font-bold text-[var(--color-ice)]/40">
                          {String(day.dayNumber).padStart(2, "0")}
                        </span>
                        <span className="truncate text-lg font-bold text-[var(--color-mist)] sm:text-xl">
                          {day.title}
                        </span>
                      </div>
                      <span
                        className="shrink-0 text-[var(--color-slate)] transition-transform duration-300 group-open:rotate-180"
                        aria-hidden="true"
                      >
                        <ChevronIcon />
                      </span>
                    </summary>
                    <div className="border-t border-[var(--color-border-hairline-faint)] bg-[var(--color-surface-hover-a)] px-5 pb-6 pt-0 sm:px-6">
                      <div className="mt-5 space-y-3">
                        <p className="leading-relaxed text-[var(--color-slate)]">
                          {day.description}
                        </p>
                        {(day.attractions?.length || day.meals.length > 0 || day.accommodation) && (
                          <ul className="flex flex-wrap gap-4 text-xs font-semibold text-[var(--color-ice)]/80">
                            {day.attractions && day.attractions.length > 0 && (
                              <li>Attractions: {day.attractions.join(", ")}</li>
                            )}
                            {day.meals.length > 0 && (
                              <li>Meals: {day.meals.join(", ")}</li>
                            )}
                            {day.accommodation && (
                              <li>{day.accommodation}</li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Guides */}
          {upcomingGuides.length > 0 && (
            <div id="guides" className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ice)] sm:text-3xl">
                Your Guides
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {upcomingGuides.map((guide) => (
                  <GuideCard
                    key={guide.staffId}
                    guide={guide}
                    ledDates={upcoming.filter((dep) => dep.guideId === guide.staffId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Kashrut */}
          <div id="kashrut" className="glass-panel space-y-4 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[var(--color-mist)]">
              Kashrut &amp; What to Know
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-slate)]">
                  Supervision
                </dt>
                <dd className="mt-1 text-[15px] text-[var(--color-mist)]">
                  {tour.kashrutDetails.supervisionLevel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-slate)]">
                  Pat Yisrael
                </dt>
                <dd className="mt-1 text-[15px] text-[var(--color-mist)]">
                  {kashrutStatusLabel(tour.kashrutDetails.patYisrael)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-slate)]">
                  Chalav Yisrael
                </dt>
                <dd className="mt-1 text-[15px] text-[var(--color-mist)]">
                  {kashrutStatusLabel(tour.kashrutDetails.chalavYisrael)}
                </dd>
              </div>
            </dl>
            {tour.kashrutDetails.notes && (
              <p className="text-[15px] leading-relaxed text-[var(--color-slate)]">
                {tour.kashrutDetails.notes}
              </p>
            )}
          </div>

          {/* Inclusions / Exclusions */}
          {hasInclusions && (
            <div id="included" className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              <div className="glass-panel rounded-2xl p-6 sm:p-8">
                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[var(--color-mist)]">
                  <span className="text-[var(--color-ice)]" aria-hidden="true">
                    ✓
                  </span>
                  What&apos;s Included
                </h3>
                <ul className="space-y-4">
                  {tour.inclusions.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 text-sm text-[var(--color-ice)]"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <span className="text-[var(--color-slate)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass-panel rounded-2xl p-6 sm:p-8">
                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[var(--color-mist)]/60">
                  <span aria-hidden="true">✕</span>
                  Not Included
                </h3>
                <ul className="space-y-4">
                  {tour.exclusions.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 opacity-60"
                    >
                      <span className="mt-0.5 text-sm" aria-hidden="true">
                        ✕
                      </span>
                      <span className="text-[var(--color-slate)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Testimonials */}
          {shownTestimonials.length > 0 && (
            <div id="testimonials" className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ice)] sm:text-3xl">
                  What Travelers Say
                </h2>
                <a
                  href="/testimonials"
                  className="text-sm font-semibold text-[var(--color-ice)] hover:underline"
                >
                  All testimonials &rarr;
                </a>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {shownTestimonials.map((review) => (
                  <TestimonialCard key={review.reviewId} review={review} />
                ))}
              </div>
            </div>
          )}

          {/* Cancellation policy */}
          <div id="cancellation" className="glass-panel space-y-4 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[var(--color-mist)]">Cancellation Policy</h2>
            <ul className="space-y-3">
              {cancellationTerms.map((term, index) => (
                <li key={`${index}-${term}`} className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ice)]"
                    aria-hidden="true"
                  />
                  <span className="text-[15px] leading-relaxed text-[var(--color-slate)]">{term}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sticky booking — top offset clears the site header plus the section nav */}
        <aside id="dates" className="relative">
          <div className="glass-panel-elevated sticky top-40 rounded-2xl p-6 shadow-2xl sm:p-8">
            <div className="mb-6">
              <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[var(--color-slate)]">
                Starting from
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[var(--color-mist)]">
                  {formatUsd(tour.pricing.pricePerPersonDouble)}
                </span>
                <span className="text-sm text-[var(--color-slate)]">/ per person</span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-slate)]">
                Double occupancy · {formatUsd(tour.pricing.pricePerPersonSingle)} / person for a
                private room
              </p>
            </div>

            {bookingHighlights.length > 0 && (
              <div className="mb-6 space-y-4 border-y border-[var(--color-border-hairline-faint)] py-6">
                {bookingHighlights.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ice)]" aria-hidden="true" />
                    <span className="font-medium text-[var(--color-mist)]">{item}</span>
                  </div>
                ))}
              </div>
            )}

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-slate)]">
              Departure Dates
            </h3>
            <ul className="mb-6 space-y-2">
              {upcoming.length === 0 && (
                <li className="text-[15px] text-[var(--color-slate)]">
                  The next date for this tour will be published soon.
                </li>
              )}
              {upcoming.map((dep) => {
                const seats = availableSeats(dep);
                const guide = dep.guideId ? guideById.get(dep.guideId) : undefined;
                return (
                  <li
                    key={dep.departureId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border-hairline)] bg-[var(--color-surface-hover-a)] px-3 py-2.5 text-[15px]"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-[var(--color-mist)]">
                        {new Date(dep.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {guide && (
                        <p className="truncate text-xs text-[var(--color-slate)]">
                          Guide: {guide.name}
                        </p>
                      )}
                      <DepartureStatusPill
                        status={dep.status}
                        seats={seats}
                        lowSeatsThreshold={lowSeatsThreshold}
                      />
                    </div>
                    {isDepartureBookable(dep) && (
                      <a
                        href={bookHref(dep.departureId)}
                        className="shrink-0 rounded-lg bg-[var(--color-success)] px-4 py-2 text-sm font-bold text-white shadow-[0_6px_14px_rgba(16,185,129,0.2)] transition-all hover:bg-[var(--color-success-dark)] active:scale-[0.98]"
                      >
                        Book
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <a
              href="tel:18008470700"
              className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-slate)] transition-colors hover:text-[var(--color-ice)]"
            >
              Call 1-800-847-0700
            </a>

            <div className="mt-8 border-t border-[var(--color-border-hairline-faint)] pt-6">
              <div className="flex items-start gap-3 rounded-xl border border-[var(--color-ice)]/10 bg-[var(--color-ice)]/5 p-4">
                <span className="mt-0.5 text-[var(--color-ice)]" aria-hidden="true">
                  ✓
                </span>
                <p className="text-xs leading-tight text-[var(--color-slate)]">
                  Secure your spot with a $
                  {tour.pricing.depositAmountPerPerson} deposit per person.
                  Balance due {tour.pricing.balanceDueDaysBeforeDeparture}{" "}
                  days before departure.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </article>
  );
}

function TourHeroGallery({
  images,
  alt,
  title,
  badge,
  countries,
  durationDays,
}: {
  images: string[];
  alt: string;
  title: string;
  badge: string;
  countries: string[];
  durationDays: number;
}) {
  const safe = images.length ? images : ["/placeholder.svg"];
  const main = safe[0];
  const side = [safe[1] ?? safe[0], safe[2] ?? safe[0], safe[3] ?? safe[0]];
  const extraCount = Math.max(safe.length - 4, 0);

  return (
    <section className="relative flex w-full flex-col gap-2 p-2 md:h-[min(716px,80vh)] md:flex-row">
      <div className="group relative h-[420px] overflow-hidden rounded-xl md:h-full md:w-2/3">
        <SafeImage
          src={main}
          alt={alt}
          sizes="(min-width: 768px) 66vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/80 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8">
          <span className="mb-3 inline-block rounded-full border border-[#c8a0f0]/30 bg-[#c8a0f0]/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#c8a0f0]">
            {badge}
          </span>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="text-sm font-medium text-[#a0b4c4] sm:text-base">
            {countries.join(" & ")}
            <span className="mx-2 text-white/30" aria-hidden="true">
              ·
            </span>
            {durationDays} days
          </p>
        </div>
      </div>

      <div className="hidden h-full w-1/3 flex-col gap-2 md:flex">
        {side.map((src, i) => {
          const isLast = i === side.length - 1;
          return (
            <div
              key={`${src}-${i}`}
              className="group relative h-1/3 overflow-hidden rounded-xl"
            >
              <SafeImage
                src={src}
                alt=""
                sizes="33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {isLast && extraCount > 0 && (
                <div className="absolute inset-0 flex cursor-default items-center justify-center bg-black/40 transition-all hover:bg-black/25">
                  <span className="text-lg font-bold text-white">
                    +{extraCount} Photos
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile secondary strip */}
      <div className="flex gap-2 md:hidden">
        {side.slice(0, 3).map((src, i) => (
          <div
            key={`m-${src}-${i}`}
            className="relative h-24 flex-1 overflow-hidden rounded-lg"
          >
            <SafeImage src={src} alt="" sizes="33vw" className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

function GuideCard({ guide, ledDates }: { guide: Staff; ledDates: Departure[] }) {
  return (
    <div className="glass-panel flex gap-4 rounded-2xl p-5 sm:p-6">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[var(--color-surface-hover-b)]">
        {guide.photo ? (
          <SafeImage src={guide.photo} alt={guide.name} sizes="80px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--color-ice)]/60">
            {guide.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-lg font-bold text-[var(--color-mist)]">{guide.name}</p>
        {guide.bio && (
          <p className="text-[15px] leading-relaxed text-[var(--color-slate)]">{guide.bio}</p>
        )}
        <p className="text-xs font-semibold text-[var(--color-ice)]/80">
          Leading{" "}
          {ledDates
            .map((dep) =>
              new Date(dep.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            )
            .join(" · ")}
        </p>
      </div>
    </div>
  );
}

function QuickFact({
  icon,
  label,
  value,
}: {
  icon: "schedule" | "groups" | "public";
  label: string;
  value: string;
}) {
  return (
    <div className="glass-panel flex flex-col items-center rounded-xl p-5 text-center sm:p-6">
      <span className="mb-2 text-[var(--color-ice)]" aria-hidden="true">
        {icon === "schedule" && <IconClock />}
        {icon === "groups" && <IconGroups />}
        {icon === "public" && <IconGlobe />}
      </span>
      <span className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-slate)]">
        {label}
      </span>
      <span className="font-medium text-[var(--color-mist)]">{value}</span>
    </div>
  );
}

function IconClock() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

function IconGroups() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M3.5 18c0-2.5 2.2-4.5 5.5-4.5s5.5 2 5.5 4.5" strokeLinecap="round" />
      <path d="M14 18c.3-1.8 1.8-3.2 4-3.5 1.8.2 3 1.4 3 3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DepartureStatusPill({
  status,
  seats,
  lowSeatsThreshold,
}: {
  status: Departure["status"];
  seats: number;
  lowSeatsThreshold: number;
}) {
  if (status === "soldout" || seats <= 0) {
    return (
      <span className="rounded-full bg-[var(--color-surface-hover-b)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-slate)]">
        Sold Out
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-[var(--color-danger)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-danger)]">
        Cancelled
      </span>
    );
  }
  if (seats <= lowSeatsThreshold) {
    return (
      <span className="rounded-full bg-[var(--color-lilac)]/20 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-lilac)]">
        Only {seats} spots left
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--color-ice)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ice)]">
      Available
    </span>
  );
}
