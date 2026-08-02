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
  const baseTotal =
    (doubleTravelers + singleTravelers) * pricing.pricePerPersonDouble +
    tripleTravelers * tripleRate;

  const singleSupplementsTotal = room.singleRooms * pricing.singleSupplement;

  // The full child charge (not a delta) — falls back to the adult rate
  // when no separate child price is configured for the tour.
  const childAdjustments = childCount * (pricing.childPrice ?? pricing.pricePerPersonDouble);

  const grandTotal = baseTotal + singleSupplementsTotal + childAdjustments;

  return {
    baseTotal,
    singleSupplementsTotal,
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
