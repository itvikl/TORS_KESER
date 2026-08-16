import type { Departure, Tour } from "@/lib/types";
import { availableSeats } from "@/lib/types";
import { isDeparturePlanned } from "@/lib/departureAvailability";
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
  previewMode = false,
  lowSeatsThreshold = 5,
}: {
  tour: Tour;
  departures: Departure[];
  /** True when rendered inside the admin's preview pane for an unpublished draft. */
  previewMode?: boolean;
  /** At/below this remaining-seats count, the departure pill shows the exact number. Defaults to the site's pre-existing behavior for the preview contexts that don't fetch SiteSettings. */
  lowSeatsThreshold?: number;
}) {
  const upcoming = departures.filter(isDeparturePlanned);
  const nights = Math.max(tour.durationDays - 1, 0);
  const badge = tour.themeTags[0] ?? tour.travelStyle;
  const bookingHighlights = [
    tour.flightsIncluded ? "Flights included" : null,
    "Fully kosher program",
    tour.inclusions[0] ?? null,
  ].filter(Boolean) as string[];

  return (
    <article className="bg-[#0a0e1a] text-[#e0e8f0] selection:bg-[#7dd3fc]/30">
      {previewMode && (
        <div className="bg-[#c8a0f0]/20 px-4 py-2 text-center text-sm font-semibold text-[#c8a0f0]">
          PREVIEW MODE — Not Published
        </div>
      )}

      <TourHeroGallery
        images={[tour.heroImage, ...tour.gallery].filter(Boolean)}
        alt={tour.title}
        title={tour.title}
        badge={badge}
        region={tour.region}
        durationDays={tour.durationDays}
      />

      <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:gap-12 lg:px-8 lg:py-16">
        <div className="space-y-14 lg:col-span-2">
          {/* Overview */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#7dd3fc] sm:text-3xl">
              Overview
            </h2>
            <TextReveal
              text={tour.description || tour.summary}
              className="text-lg leading-relaxed text-[#a0b4c4]"
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
                label="Region"
                value={tour.region}
              />
            </div>
          </div>

          {/* Itinerary */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#7dd3fc] sm:text-3xl">
              Your Journey Day by Day
            </h2>
            <div className="space-y-3">
              {tour.itineraryDays.map((day, index) => (
                <details
                  key={day.dayId}
                  open={index === 0}
                  className="glass-panel group overflow-hidden rounded-xl"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-white/5 sm:p-6 [&::-webkit-details-marker]:hidden">
                    <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                      <span className="shrink-0 text-2xl font-bold text-[#7dd3fc]/40">
                        {String(day.dayNumber).padStart(2, "0")}
                      </span>
                      <span className="truncate text-lg font-bold text-[#e0e8f0] sm:text-xl">
                        {day.title}
                      </span>
                    </div>
                    <span
                      className="shrink-0 text-[#a0b4c4] transition-transform duration-300 group-open:rotate-180"
                      aria-hidden="true"
                    >
                      <ChevronIcon />
                    </span>
                  </summary>
                  <div className="border-t border-white/5 bg-white/5 px-5 pb-6 pt-0 sm:px-6">
                    <div className="mt-5 space-y-3">
                      <p className="leading-relaxed text-[#a0b4c4]">
                        {day.description}
                      </p>
                      {(day.attractions?.length || day.meals.length > 0 || day.accommodation) && (
                        <ul className="flex flex-wrap gap-4 text-xs font-semibold text-[#7dd3fc]/80">
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

          {/* Kashrut */}
          <div className="glass-panel space-y-4 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[#e0e8f0]">
              Kashrut &amp; What to Know
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-[#a0b4c4]">
                  Supervision
                </dt>
                <dd className="mt-1 text-[15px] text-[#e0e8f0]">
                  {tour.kashrutDetails.supervisionLevel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-[#a0b4c4]">
                  Pat Yisrael
                </dt>
                <dd className="mt-1 text-[15px] text-[#e0e8f0]">
                  {kashrutStatusLabel(tour.kashrutDetails.patYisrael)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-[#a0b4c4]">
                  Chalav Yisrael
                </dt>
                <dd className="mt-1 text-[15px] text-[#e0e8f0]">
                  {kashrutStatusLabel(tour.kashrutDetails.chalavYisrael)}
                </dd>
              </div>
            </dl>
            {tour.kashrutDetails.notes && (
              <p className="text-[15px] leading-relaxed text-[#a0b4c4]">
                {tour.kashrutDetails.notes}
              </p>
            )}
          </div>

          {/* Inclusions / Exclusions */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            <div className="glass-panel rounded-2xl p-6 sm:p-8">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[#e0e8f0]">
                <span className="text-[#7dd3fc]" aria-hidden="true">
                  ✓
                </span>
                What&apos;s Included
              </h3>
              <ul className="space-y-4">
                {tour.inclusions.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 text-sm text-[#7dd3fc]"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span className="text-[#a0b4c4]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-panel rounded-2xl p-6 sm:p-8">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[#e0e8f0]/60">
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
                    <span className="text-[#a0b4c4]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sticky booking */}
        <aside className="relative">
          <div className="glass-panel-elevated sticky top-28 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:p-8">
            <div className="mb-6">
              <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[#a0b4c4]">
                Starting from
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  {formatUsd(tour.pricing.pricePerPersonDouble)}
                </span>
                <span className="text-sm text-[#a0b4c4]">/ per person</span>
              </div>
              <p className="mt-1 text-xs text-[#a0b4c4]">
                Double occupancy · +
                {formatUsd(tour.pricing.singleSupplement)} single supplement
              </p>
            </div>

            {bookingHighlights.length > 0 && (
              <div className="mb-6 space-y-4 border-y border-white/5 py-6">
                {bookingHighlights.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#7dd3fc]" aria-hidden="true" />
                    <span className="font-medium text-[#e0e8f0]">{item}</span>
                  </div>
                ))}
              </div>
            )}

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#a0b4c4]">
              Departure Dates
            </h3>
            <ul className="mb-6 space-y-2">
              {upcoming.length === 0 && (
                <li className="text-[15px] text-[#a0b4c4]">
                  The next date for this tour will be published soon.
                </li>
              )}
              {upcoming.map((dep) => {
                const seats = availableSeats(dep);
                return (
                  <li
                    key={dep.departureId}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-[15px]"
                  >
                    <span className="text-[#e0e8f0]">
                      {new Date(dep.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <DepartureStatusPill
                      status={dep.status}
                      seats={seats}
                      lowSeatsThreshold={lowSeatsThreshold}
                    />
                  </li>
                );
              })}
            </ul>

            <a
              href={tour.slug ? `/tours/${tour.slug}/book` : "#"}
              className="mb-3 block rounded-xl bg-[#10b981] px-4 py-4 text-center text-[15px] font-bold text-white shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all hover:bg-[#059669] active:scale-[0.98]"
            >
              Book This Trip
            </a>
            <a
              href="tel:18008470700"
              className="flex items-center justify-center gap-2 text-sm font-medium text-[#a0b4c4] transition-colors hover:text-[#7dd3fc]"
            >
              Call 1-800-847-0700
            </a>

            <div className="mt-8 border-t border-white/5 pt-6">
              <div className="flex items-start gap-3 rounded-xl border border-[#7dd3fc]/10 bg-[#7dd3fc]/5 p-4">
                <span className="mt-0.5 text-[#7dd3fc]" aria-hidden="true">
                  ✓
                </span>
                <p className="text-xs leading-tight text-[#a0b4c4]">
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
  region,
  durationDays,
}: {
  images: string[];
  alt: string;
  title: string;
  badge: string;
  region: string;
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
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
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
            {region}
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
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
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
            <SafeImage
              src={src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
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
      <span className="mb-2 text-[#7dd3fc]" aria-hidden="true">
        {icon === "schedule" && <IconClock />}
        {icon === "groups" && <IconGroups />}
        {icon === "public" && <IconGlobe />}
      </span>
      <span className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#a0b4c4]">
        {label}
      </span>
      <span className="font-medium text-[#e0e8f0]">{value}</span>
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
      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-[#a0b4c4]">
        Sold Out
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-[#ff6b6b]/15 px-2.5 py-0.5 text-xs font-semibold text-[#ff6b6b]">
        Cancelled
      </span>
    );
  }
  if (seats <= lowSeatsThreshold) {
    return (
      <span className="rounded-full bg-[#c8a0f0]/20 px-2.5 py-0.5 text-xs font-semibold text-[#c8a0f0]">
        Only {seats} spots left
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#7dd3fc]/15 px-2.5 py-0.5 text-xs font-semibold text-[#7dd3fc]">
      Available
    </span>
  );
}
