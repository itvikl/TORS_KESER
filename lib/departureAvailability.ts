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

/**
 * The date a tour card should advertise: the soonest planned departure that a
 * customer can still register for. If the very next date is full but a later
 * one has room, the later one is shown — advertising a full date sends visitors
 * to a dead end. When nothing has room it falls back to the soonest planned
 * date (the card is flagged sold out separately).
 */
export function pickNextDeparture(departures: Departure[]): Departure | undefined {
  return pickNextDepartures(departures, 1)[0];
}

/**
 * Same rule as pickNextDeparture, but up to `count` dates: the soonest planned
 * departures that still have room. Full dates are skipped; when nothing has
 * room it falls back to just the soonest planned date.
 */
export function pickNextDepartures(departures: Departure[], count = 2): Departure[] {
  const planned = departures
    .filter(isDeparturePlanned)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const bookable = planned.filter(isDepartureBookable).slice(0, count);
  if (bookable.length > 0) return bookable;
  return planned.slice(0, 1);
}

export function hasPlannedDeparture(departures: Departure[]): boolean {
  return departures.some(isDeparturePlanned);
}

export function hasBookableDeparture(departures: Departure[]): boolean {
  return departures.some(isDepartureBookable);
}
