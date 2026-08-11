import type { Departure } from "@/lib/types";
import { availableSeats } from "@/lib/types";

/**
 * Two deliberately different availability checks, shared across the public
 * site and the admin panel so they never drift out of sync again (previously
 * duplicated three times with slightly different logic).
 */

/** Has a date on the calendar, even if closed/soldout — "a departure is planned". */
export function isDeparturePlanned(departure: Departure): boolean {
  return (
    departure.status !== "cancelled" &&
    new Date(departure.startDate).getTime() >= Date.now()
  );
}

/** Can a customer register right now. */
export function isDepartureBookable(departure: Departure): boolean {
  return (
    departure.status === "open" &&
    availableSeats(departure) > 0 &&
    new Date(departure.startDate).getTime() >= Date.now()
  );
}

export function hasPlannedDeparture(departures: Departure[]): boolean {
  return departures.some(isDeparturePlanned);
}

export function hasBookableDeparture(departures: Departure[]): boolean {
  return departures.some(isDepartureBookable);
}
