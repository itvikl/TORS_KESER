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
  const tripleTravelers = room.triples * 3;
  const singleTravelers = room.singleRooms;

  const baseTotal =
    (doubleTravelers + singleTravelers + tripleTravelers) *
    pricing.pricePerPersonDouble;

  const singleSupplementsTotal = room.singleRooms * pricing.singleSupplement;

  const childAdjustments = pricing.childPrice
    ? childCount * (pricing.childPrice - pricing.pricePerPersonDouble)
    : 0;

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
