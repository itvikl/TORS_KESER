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
  const planned = departures
    .filter(isDeparturePlanned)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  return planned.find(isDepartureBookable) ?? planned[0];
}

export function hasPlannedDeparture(departures: Departure[]): boolean {
  return departures.some(isDeparturePlanned);
}

export function hasBookableDeparture(departures: Departure[]): boolean {
  return departures.some(isDepartureBookable);
}
