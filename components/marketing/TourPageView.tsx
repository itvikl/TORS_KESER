import type { Departure, Tour } from "@/lib/types";
import { availableSeats } from "@/lib/types";
import { formatUsd } from "@/lib/pricing";
import ImageGallery from "@/components/marketing/ImageGallery";

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
 */
export default function TourPageView({
  tour,
  departures,
  previewMode = false,
}: {
  tour: Tour;
  departures: Departure[];
  /** True when rendered inside the admin's preview pane for an unpublished draft. */
  previewMode?: boolean;
}) {
  const upcoming = departures.filter((d) => d.status !== "cancelled");

  return (
    <article>
      {previewMode && (
        <div className="bg-terracotta px-4 py-2 text-center text-sm font-semibold text-white">
          PREVIEW MODE — Not Published
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ImageGallery images={tour.gallery} alt={tour.title} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-olive">
              <span>{tour.region}</span>
              <span aria-hidden="true">&middot;</span>
              <span>{tour.durationDays} days</span>
              {tour.themeTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sand-warm px-2.5 py-0.5 text-olive"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="mt-3 font-display text-3xl font-semibold text-navy sm:text-4xl">
              {tour.title}
            </h1>
            <p className="mt-3 text-lg text-ink-muted">{tour.summary}</p>

            <div className="mt-8 space-y-3">
              <AccordionSection title="Day-by-Day Itinerary" defaultOpen>
                <ol className="space-y-5">
                  {tour.itineraryDays.map((day) => (
                    <li key={day.dayId} className="border-l-2 border-line pl-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-sm font-semibold text-terracotta">
                          Day {day.dayNumber}
                        </span>
                        <h3 className="font-display text-lg font-semibold text-navy">
                          {day.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-[15px] text-ink-muted">
                        {day.description}
                      </p>
                      {day.meals.length > 0 && (
                        <p className="mt-1 text-xs uppercase tracking-wider text-olive">
                          Meals: {day.meals.join(", ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </AccordionSection>

              <AccordionSection title="Kashrut & What to Know">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-olive">
                      Supervision
                    </dt>
                    <dd className="mt-1 text-[15px] text-ink">
                      {tour.kashrutDetails.supervisionLevel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-olive">
                      Pat &amp; Chalav Yisrael
                    </dt>
                    <dd className="mt-1 text-[15px] text-ink">
                      {tour.kashrutDetails.patYisrael === "not_guaranteed"
                        ? "Not guaranteed at every destination"
                        : "Guaranteed"}
                    </dd>
                  </div>
                </dl>
                {tour.kashrutDetails.notes && (
                  <p className="mt-4 text-[15px] text-ink-muted">
                    {tour.kashrutDetails.notes}
                  </p>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-olive">
                      Included
                    </h4>
                    <ul className="mt-2 space-y-1 text-[15px] text-ink">
                      {tour.inclusions.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-olive" aria-hidden="true">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Not Included
                    </h4>
                    <ul className="mt-2 space-y-1 text-[15px] text-ink-muted">
                      {tour.exclusions.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span aria-hidden="true">–</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionSection>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-line bg-white/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                From
              </p>
              <p className="font-display text-3xl font-semibold text-terracotta">
                {formatUsd(tour.pricing.pricePerPersonDouble)}
                <span className="text-sm font-normal text-ink-muted"> /person</span>
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Double occupancy &middot; +{formatUsd(tour.pricing.singleSupplement)} single supplement
              </p>

              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Departure Dates
              </h3>
              <ul className="mt-2 space-y-2">
                {upcoming.length === 0 && (
                  <li className="text-[15px] text-ink-muted">
                    No upcoming departures — leave your details below and
                    we&apos;ll notify you when the next one is scheduled.
                  </li>
                )}
                {upcoming.map((dep) => {
                  const seats = availableSeats(dep);
                  return (
                    <li
                      key={dep.departureId}
                      className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[15px]"
                    >
                      <span>
                        {new Date(dep.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <DepartureStatusPill status={dep.status} seats={seats} />
                    </li>
                  );
                })}
              </ul>

              <a
                href="#book"
                className="mt-5 block rounded-lg bg-terracotta px-4 py-3 text-center text-[15px] font-semibold text-white transition-colors hover:bg-terracotta-dark"
              >
                Book This Tour
              </a>
              <a
                href="tel:18008470700"
                className="mt-2 block rounded-lg border border-navy px-4 py-3 text-center text-[15px] font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
              >
                ☎ Call 1-800-847-0700
              </a>
              <p className="mt-3 text-center text-xs text-ink-muted">
                ${tour.pricing.depositAmountPerPerson} deposit per person &middot; balance due{" "}
                {tour.pricing.balanceDueDaysBeforeDeparture} days before departure
              </p>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-line bg-white/60 px-5 py-4 open:pb-5"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-semibold text-navy">
        {title}
        <span className="text-ink-muted transition-transform group-open:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function DepartureStatusPill({
  status,
  seats,
}: {
  status: Departure["status"];
  seats: number;
}) {
  if (status === "soldout" || seats <= 0) {
    return (
      <span className="rounded-full bg-ink-muted/15 px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
        Sold Out
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-terracotta/15 px-2.5 py-0.5 text-xs font-semibold text-terracotta-dark">
        Cancelled
      </span>
    );
  }
  if (seats <= 5) {
    return (
      <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-terracotta-dark">
        Only {seats} spots left
      </span>
    );
  }
  return (
    <span className="rounded-full bg-olive/15 px-2.5 py-0.5 text-xs font-semibold text-olive">
      Available
    </span>
  );
}
