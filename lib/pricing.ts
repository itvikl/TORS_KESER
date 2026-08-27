import type { PriceBreakdown, RoomConfiguration, TourPricing } from "@/lib/types";

/**
 * Computes the total price for a booking from room configuration.
 * This MUST be recomputed server-side from the tour/departure's own pricing
 * data on every booking mutation — never trust a total sent by the client
 * (PRD FR-13).
 */
export function calculatePriceBreakdown(
  pricing: TourPricing,
  room: RoomConfiguration,
  childCount = 0
): PriceBreakdown {
  const doubleTravelers = room.doubleRooms * 2;
  const singleTravelers = room.singleRooms;
  const tripleTravelers = room.triples * 3;
  const tripleRate = pricing.pricePerPersonTriple ?? pricing.pricePerPersonDouble;

  // Adults only — children are priced separately below, not folded into
  // this base (they were previously included here at the adult rate and
  // then "corrected" via a subtraction in childAdjustments, which meant a
  // booking with children was never actually charged for them: the
  // subtraction had nothing added to offset).
  //
  // Single occupancy is its own flat per-person rate, not the double rate
  // plus a supplement — pricePerPersonSingle is the whole price a solo
  // traveler pays, full stop.
  const baseTotal =
    doubleTravelers * pricing.pricePerPersonDouble +
    singleTravelers * pricing.pricePerPersonSingle +
    tripleTravelers * tripleRate;

  // The full child charge (not a delta) — falls back to the adult rate
  // when no separate child price is configured for the tour.
  const childAdjustments = childCount * (pricing.childPrice ?? pricing.pricePerPersonDouble);

  const grandTotal = baseTotal + childAdjustments;

  return {
    baseTotal,
    childAdjustments,
    grandTotal,
  };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
