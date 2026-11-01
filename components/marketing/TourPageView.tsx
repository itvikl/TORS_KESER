import type { Departure, Review, Staff, Tour, TourInfoCard, TourInfoField } from "@/lib/types";
import { availableSeats } from "@/lib/types";
import { isDepartureBookable, isDeparturePlanned } from "@/lib/departureAvailability";
import { DEFAULT_CANCELLATION_POLICY_TEXT } from "@/lib/cancellationPolicy";
import TourSectionNav, { type TourSectionLink } from "@/components/marketing/TourSectionNav";
import StickyBookingCard from "@/components/marketing/StickyBookingCard";
import TourHeroGallery from "@/components/marketing/TourHeroGallery";
import TestimonialCard from "@/components/marketing/TestimonialCard";
import DepartureStatusPill from "@/components/marketing/DepartureStatusPill";
import GuideAvatar from "@/components/marketing/GuideAvatar";
import { formatUsd, singleSupplementOf } from "@/lib/pricing";
import TextReveal from "@/components/ui/TextReveal";
import { PhoneLink } from "@/components/marketing/SitePhone";
import { TOUR_PAGE_COPY_DEFAULTS, fillCopy, type TourPageCopy } from "@/lib/siteCopy";

/**
 * KashrutDetails.patYisrael/chalavYisrael are each a 3-way value
 * (true | false | "not_guaranteed"), not a boolean — a naive `=== "not_guaranteed"
 * ? ... : "Guaranteed"` ternary silently renders `false` ("Not offered", a
 * real option in the admin editor) as "Guaranteed".
 */
function kashrutStatusLabel(value: boolean | "not_guaranteed", copy: TourPageCopy): string {
  if (value === true) return copy.kashrutGuaranteed;
  if (value === "not_guaranteed") return copy.kashrutNotGuaranteed;
  return copy.kashrutNotOffered;
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
  copy = TOUR_PAGE_COPY_DEFAULTS,
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
  /** Admin-editable wording (Site Content → Tour Page). */
  copy?: TourPageCopy;
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
  const kashrutTitle = tour.kashrutDetails.title?.trim() || copy.kashrutDefaultTitle;
  const kashrutExtraFields = visibleFields(tour.kashrutDetails.extraFields);
  const infoCards = infoCardsOf(tour, copy);
  const hasInclusions = tour.inclusions.length > 0 || tour.exclusions.length > 0;
  const documents = (tour.documents ?? []).filter((doc) => doc.url && doc.title.trim());
  const sections: TourSectionLink[] = [
    { id: "overview", label: copy.navOverview },
    ...(hasItinerary ? [{ id: "itinerary", label: copy.navItinerary }] : []),
    ...(upcomingGuides.length > 0 ? [{ id: "guides", label: copy.navGuides }] : []),
    { id: "kashrut", label: kashrutTitle },
    ...infoCards.map((card) => ({ id: infoCardAnchor(card), label: card.title })),
    ...(hasInclusions ? [{ id: "included", label: copy.navIncluded }] : []),
    ...(documents.length > 0 ? [{ id: "downloads", label: copy.navDownloads }] : []),
    ...(shownTestimonials.length > 0 ? [{ id: "testimonials", label: copy.navTestimonials }] : []),
    { id: "cancellation", label: copy.navCancellation },
    { id: "dates", label: copy.navDates, mobileOnly: true },
  ];
  const bookHref = (departureId: string) =>
    tour.slug ? `/tours/${tour.slug}/book?departure=${encodeURIComponent(departureId)}` : "#";
  const nights = Math.max(tour.durationDays - 1, 0);
  const badge = tour.themeTags[0] ?? tour.travelStyle;
  const bookingHighlights = [
    tour.flightsIncluded ? copy.flightsHighlight : null,
    copy.kosherHighlight,
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
        durationLabel={fillCopy(copy.heroDays, { days: tour.durationDays })}
        morePhotosTemplate={copy.heroMorePhotos}
        focus={tour.imageFocus}
      />

      <TourSectionNav sections={sections} />

      <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:gap-12 lg:px-8 lg:py-16">
        <div className="space-y-14 lg:col-span-2">
          {/* Overview */}
          <div id="overview" className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ice)] sm:text-3xl">
              {copy.overviewHeading}
            </h2>
            <TextReveal
              text={tour.description || tour.summary}
              className="text-lg leading-relaxed text-[var(--color-slate)]"
            />

            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
              <QuickFact
                icon="schedule"
                label={copy.durationLabel}
                value={fillCopy(copy.durationValue, { days: tour.durationDays, nights })}
              />
              <QuickFact
                icon="groups"
                label={copy.groupSizeLabel}
                value={
                  tour.minGroupSize
                    ? fillCopy(copy.groupSizeValue, { count: tour.minGroupSize })
                    : copy.groupSizeFallback
                }
              />
              <QuickFact
                icon="public"
                label={copy.countriesLabel}
                value={tour.countries.join(", ")}
              />
            </div>
          </div>

          {/* Itinerary */}
          {hasItinerary && (
            <div id="itinerary" className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ice)] sm:text-3xl">
                {copy.itineraryHeading}
              </h2>
              <div className="space-y-3">
                {tour.itineraryDays.map((day, index) => (
                  <details
                    key={day.dayId}
                    open={index === 0}
                    className="glass-panel group overflow-hidden rounded-xl"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-[var(--color-surface-hover-a)] sm:p-6 [&::-webkit-details-marker]:hidden">
                      <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
                        <span className="shrink-0 text-2xl font-bold text-[var(--color-ice)]/40">
                          {String(day.dayNumber).padStart(2, "0")}
                        </span>
                        {/* Long titles wrap to two lines instead of truncating on one */}
                        <span className="line-clamp-2 min-w-0 text-lg font-bold leading-snug text-[var(--color-mist)] sm:text-xl">
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
                        <p className="whitespace-pre-line leading-relaxed text-[var(--color-slate)]">
                          {day.description}
                        </p>
                        {(day.attractions?.length || day.meals.length > 0 || day.accommodation) && (
                          <ul className="flex flex-wrap gap-4 text-xs font-semibold text-[var(--color-ice)]/80">
                            {day.attractions && day.attractions.length > 0 && (
                              <li>{copy.attractionsLabel} {day.attractions.join(", ")}</li>
                            )}
                            {day.meals.length > 0 && (
                              <li>{copy.mealsLabel} {day.meals.join(", ")}</li>
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
                {copy.guidesHeading}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {upcomingGuides.map((guide) => (
                  <GuideCard
                    key={guide.staffId}
                    guide={guide}
                    leadingLabel={copy.guideLeadingLabel}
                    ledDates={upcoming.filter((dep) => dep.guideId === guide.staffId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Kashrut */}
          <div id="kashrut" className="glass-panel space-y-4 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[var(--color-mist)]">{kashrutTitle}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoFieldItem label={copy.supervisionLabel} value={tour.kashrutDetails.supervisionLevel} />
              <InfoFieldItem label={copy.patYisraelLabel} value={kashrutStatusLabel(tour.kashrutDetails.patYisrael, copy)} />
              <InfoFieldItem
                label={copy.chalavYisraelLabel}
                value={kashrutStatusLabel(tour.kashrutDetails.chalavYisrael, copy)}
              />
              {kashrutExtraFields.map((field) => (
                <InfoFieldItem key={field.fieldId} label={field.label} value={field.value} />
              ))}
            </dl>
            {tour.kashrutDetails.notes && (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-slate)]">
                {tour.kashrutDetails.notes}
              </p>
            )}
          </div>

          {/* Admin-defined info cards (Important to Know, etc.) */}
          {infoCards.map((card) => (
            <InfoCardPanel key={card.cardId} card={card} />
          ))}

          {/* Inclusions / Exclusions */}
          {hasInclusions && (
            <div id="included" className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              <div className="glass-panel rounded-2xl p-6 sm:p-8">
                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[var(--color-mist)]">
                  <span className="text-[var(--color-ice)]" aria-hidden="true">
                    ✓
                  </span>
                  {copy.includedHeading}
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
                  {copy.notIncludedHeading}
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

          {/* Downloads (PDFs uploaded in the admin tour editor) */}
          {documents.length > 0 && (
            <div id="downloads" className="glass-panel space-y-4 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-bold text-[var(--color-mist)]">{copy.navDownloads}</h2>
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <li key={doc.documentId}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 rounded-xl border border-[var(--color-border-ice)] bg-[var(--color-field-bg)] p-4 transition-colors hover:border-[var(--color-ice)]"
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ice)]/15 text-xs font-bold tracking-wide text-[var(--color-ice)]"
                        aria-hidden="true"
                      >
                        PDF
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[var(--color-mist)]">
                        {doc.title}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-[var(--color-ice)] transition-all group-hover:translate-y-0.5">
                        Download <span aria-hidden="true">↓</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Testimonials */}
          {shownTestimonials.length > 0 && (
            <div id="testimonials" className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ice)] sm:text-3xl">
                  {copy.testimonialsHeading}
                </h2>
                <a
                  href="/testimonials"
                  className="text-sm font-semibold text-[var(--color-ice)] hover:underline"
                >
                  {copy.testimonialsLink} &rarr;
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
            <h2 className="text-xl font-bold text-[var(--color-mist)]">{copy.cancellationHeading}</h2>
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
          <StickyBookingCard className="glass-panel-elevated sticky top-40 rounded-2xl p-6 shadow-2xl sm:p-8 lg:p-5">
            <div className="mb-6 lg:mb-3">
              <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[var(--color-slate)]">
                {copy.priceLabel}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[var(--color-mist)] lg:text-3xl">
                  {formatUsd(tour.pricing.pricePerPersonDouble)}
                </span>
                <span className="text-sm text-[var(--color-slate)]">{copy.perPersonLabel}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-slate)]">
                {fillCopy(copy.priceNote, { singlePrice: formatUsd(tour.pricing.pricePerPersonSingle) })}
                {singleSupplementOf(tour.pricing) > 0 &&
                  copy.priceSupplement &&
                  ` ${fillCopy(copy.priceSupplement, { supplement: formatUsd(singleSupplementOf(tour.pricing)) })}`}
              </p>
            </div>

            {bookingHighlights.length > 0 && (
              <div className="mb-6 space-y-4 border-y border-[var(--color-border-hairline-faint)] py-6 lg:mb-3 lg:space-y-1 lg:py-3">
                {bookingHighlights.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ice)]" aria-hidden="true" />
                    <span className="font-medium text-[var(--color-mist)] lg:text-sm">{item}</span>
                  </div>
                ))}
              </div>
            )}

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-slate)]">
              {copy.departuresHeading}
            </h3>
            <ul className="mb-6 space-y-2 lg:mb-4">
              {upcoming.length === 0 && (
                <li className="text-[15px] text-[var(--color-slate)]">
                  {copy.noDatesMessage}
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
                        <p className="flex min-w-0 items-center gap-2 text-xs text-[var(--color-slate)]">
                          <GuideAvatar guide={guide} className="h-7 w-7" sizes="28px" />
                          <span className="truncate">{copy.guideLabel} {guide.name}</span>
                        </p>
                      )}
                      <DepartureStatusPill
                        status={dep.status}
                        seats={seats}
                        lowSeatsThreshold={lowSeatsThreshold}
                        copy={copy}
                      />
                    </div>
                    {isDepartureBookable(dep) && (
                      <a
                        href={bookHref(dep.departureId)}
                        className="shrink-0 rounded-lg bg-[var(--color-success)] px-4 py-2 text-sm font-bold text-white shadow-[0_6px_14px_rgba(16,185,129,0.2)] transition-all hover:bg-[var(--color-success-dark)] active:scale-[0.98]"
                      >
                        {copy.bookButton}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <PhoneLink className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-slate)] transition-colors hover:text-[var(--color-ice)]" prefix={`${copy.callPrefix} `} />

            <div className="mt-8 border-t border-[var(--color-border-hairline-faint)] pt-6 lg:mt-4 lg:pt-4">
              <div className="flex items-start gap-3 rounded-xl border border-[var(--color-ice)]/10 bg-[var(--color-ice)]/5 p-4 lg:p-3">
                <span className="mt-0.5 text-[var(--color-ice)]" aria-hidden="true">
                  ✓
                </span>
                <p className="text-xs leading-tight text-[var(--color-slate)]">
                  {tour.pricing.depositAmountPerPerson > 0
                    ? fillCopy(copy.depositNote, {
                        deposit: formatUsd(tour.pricing.depositAmountPerPerson),
                        days: tour.pricing.balanceDueDaysBeforeDeparture,
                      })
                    : fillCopy(copy.noDepositNote, { days: tour.pricing.balanceDueDaysBeforeDeparture })}
                </p>
              </div>
            </div>
          </StickyBookingCard>
        </aside>
      </section>
    </article>
  );
}

function visibleFields(fields: TourInfoField[] | undefined): TourInfoField[] {
  return (fields ?? []).filter((f) => f.label.trim() || f.value.trim());
}

/** Cards to render, including a tour's legacy importantToKnow list if it hasn't been re-saved since info cards existed. */
function infoCardsOf(tour: Tour, copy: TourPageCopy): TourInfoCard[] {
  const legacy = (tour.importantToKnow ?? []).map((item) => item.trim()).filter(Boolean);
  const cards: TourInfoCard[] = [
    ...(legacy.length > 0
      ? [{ cardId: "important-to-know", title: copy.importantToKnowHeading, fields: [], items: legacy }]
      : []),
    ...(tour.infoCards ?? []),
  ];
  return cards
    .map((card) => ({
      ...card,
      title: card.title.trim(),
      fields: visibleFields(card.fields),
      items: card.items.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((card) => card.title && (card.fields.length > 0 || card.notes?.trim() || card.items.length > 0));
}

function infoCardAnchor(card: TourInfoCard): string {
  return `info-${card.cardId}`;
}

function InfoFieldItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-slate)]">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line text-[15px] text-[var(--color-mist)]">{value}</dd>
    </div>
  );
}

function InfoCardPanel({ card }: { card: TourInfoCard }) {
  return (
    <div id={infoCardAnchor(card)} className="glass-panel space-y-4 rounded-2xl p-6 sm:p-8">
      <h2 className="text-xl font-bold text-[var(--color-mist)]">{card.title}</h2>
      {card.fields.length > 0 && (
        <dl className="grid gap-4 sm:grid-cols-2">
          {card.fields.map((field) => (
            <InfoFieldItem key={field.fieldId} label={field.label} value={field.value} />
          ))}
        </dl>
      )}
      {card.notes?.trim() && (
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-slate)]">
          {card.notes}
        </p>
      )}
      {card.items.length > 0 && (
        <ul className="space-y-3">
          {card.items.map((item, index) => (
            <li key={`${index}-${item}`} className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ice)]"
                aria-hidden="true"
              />
              <span className="text-[15px] leading-relaxed text-[var(--color-slate)]">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GuideCard({ guide, ledDates, leadingLabel }: { guide: Staff; ledDates: Departure[]; leadingLabel: string }) {
  return (
    <div className="glass-panel flex gap-4 rounded-2xl p-5 sm:p-6">
      <GuideAvatar guide={guide} className="h-20 w-20" sizes="80px" />
      <div className="min-w-0 space-y-2">
        <p className="text-lg font-bold text-[var(--color-mist)]">{guide.name}</p>
        {guide.bio && (
          <p className="text-[15px] leading-relaxed text-[var(--color-slate)]">{guide.bio}</p>
        )}
        <p className="text-xs font-semibold text-[var(--color-ice)]/80">
          {leadingLabel}{" "}
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

