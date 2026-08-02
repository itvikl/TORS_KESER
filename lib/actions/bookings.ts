"use server";

import { adminDb } from "@/lib/firebase/admin";
import { calculatePriceBreakdown } from "@/lib/pricing";
import { BookingInputSchema } from "@/lib/validation/booking";
import type { Booking, Departure, Tour, Traveler } from "@/lib/types";

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; errors: Record<string, string[]> };

/**
 * Public, unauthenticated action — anyone can submit a registration (no
 * customer account system exists yet). No payment happens here: every
 * booking is written as `pending_payment` regardless of the customer's
 * chosen contactPreference (callback vs. pay online), since Stripe isn't
 * wired up. Staff follow up from /admin/bookings either way.
 *
 * Deliberately does NOT touch departures.capacityHeld/capacityBooked (PRD
 * FR-14's overbooking-prevention transaction) — that machinery needs a
 * matching hold-expiry Cloud Function (FR-22) that doesn't exist yet.
 * Wiring one without the other would let held seats pile up with no way to
 * release them, so capacity enforcement is left for a dedicated pass.
 */
export async function createBooking(input: unknown): Promise<CreateBookingResult> {
  const parsed = BookingInputSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      (errors[key] ??= []).push(issue.message);
    }
    return { ok: false, errors };
  }
  const data = parsed.data;

  const departureSnap = await adminDb().collection("departures").doc(data.departureId).get();
  if (!departureSnap.exists) {
    return { ok: false, errors: { departureId: ["This departure is no longer available."] } };
  }
  const departure = departureSnap.data() as Departure;

  const tourSnap = await adminDb().collection("tours").doc(departure.tourId).get();
  if (!tourSnap.exists) {
    return { ok: false, errors: { departureId: ["This tour is no longer available."] } };
  }
  const tour = tourSnap.data() as Tour;

  // Price is always recomputed server-side from the tour's own pricing —
  // never trusted from the client.
  const priceBreakdown = calculatePriceBreakdown(
    tour.pricing,
    data.roomConfiguration,
    data.childCount
  );
  const travelerCount = data.travelers.length;
  const depositAmount = tour.pricing.depositAmountPerPerson * travelerCount;
  const balanceAmount = Math.max(0, priceBreakdown.grandTotal - depositAmount);

  const now = new Date().toISOString();
  const bookingRef = adminDb().collection("bookings").doc();

  const booking: Booking = {
    bookingId: bookingRef.id,
    departureId: data.departureId,
    tourId: tour.tourId,
    travelerCount,
    roomConfiguration: data.roomConfiguration,
    priceBreakdown,
    depositAmount,
    balanceAmount,
    amountPaid: 0,
    status: "pending_payment",
    contactPreference: data.contactPreference,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    createdAt: now,
    updatedAt: now,
  };

  const batch = adminDb().batch();
  batch.set(bookingRef, booking);
  for (const traveler of data.travelers) {
    const travelerRef = bookingRef.collection("travelers").doc();
    const travelerDoc: Traveler = { travelerId: travelerRef.id, ...traveler };
    batch.set(travelerRef, travelerDoc);
  }
  await batch.commit();

  return { ok: true, bookingId: bookingRef.id };
}
