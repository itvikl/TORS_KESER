import type { Departure } from "@/lib/types";
import { TOUR_PAGE_COPY_DEFAULTS, fillCopy, type DepartureStatusCopy } from "@/lib/siteCopy";

/**
 * A departure's availability label — shared by the tour page's dates list and
 * the booking form's date step so they always say the same thing. The exact
 * seat count only shows at/below SiteSettings.lowSeatsThreshold.
 */
export default function DepartureStatusPill({
  status,
  seats,
  lowSeatsThreshold,
  copy = TOUR_PAGE_COPY_DEFAULTS,
}: {
  status: Departure["status"];
  seats: number;
  lowSeatsThreshold: number;
  copy?: DepartureStatusCopy;
}) {
  if (status === "soldout" || seats <= 0) {
    return (
      <span className="rounded-full bg-[var(--color-surface-hover-b)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-slate)]">
        {copy.statusSoldOut}
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-[var(--color-danger)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-danger)]">
        {copy.statusCancelled}
      </span>
    );
  }
  if (seats <= lowSeatsThreshold) {
    return (
      <span className="rounded-full bg-[var(--color-lilac)]/20 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-lilac)]">
        {fillCopy(copy.statusLowSeats, { seats })}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--color-ice)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ice)]">
      {copy.statusAvailable}
    </span>
  );
}
