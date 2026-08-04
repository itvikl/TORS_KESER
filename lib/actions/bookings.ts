"use server";

import { adminDb } from "@/lib/firebase/admin";
import { calculatePriceBreakdown } from "@/lib/pricing";
import { BookingInputSchema } from "@/lib/validation/booking";
import type { Booking, Departure, Tour, Traveler } from "@/lib/types";

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; errors: Record<string, string[]> };

/** Internal control-flow only — never exported (a "use server" file may only export async functions). */
class BookingError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message);
  }
}

/**
 * Public, unauthenticated action — anyone can submit a registration (no
 * customer account system exists yet). No payment happens here: every
 * booking is written as `pending_payment` regardless of the customer's
 * chosen contactPreference (callback vs. pay online), since Stripe isn't
 * wired up. Staff follow up from /admin/bookings either way.
 *
 * Capacity is enforced with a Firestore transaction: unlike a Stripe
 * checkout hold (which needs an expiry + cleanup job because a customer
 * can abandon it mid-payment), a submitted registration here is a durable
 * commitment the moment it's saved — payment is deferred, not the booking
 * itself — so incrementing departures.capacityBooked directly, atomically
 * with the booking write, is correct with no companion cleanup job needed.
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

  const departureRef = adminDb().collection("departures").doc(data.departureId);
  const departurePreviewSnap = await departureRef.get();
  if (!departurePreviewSnap.exists) {
    return { ok: false, errors: { departureId: ["This departure is no longer available."] } };
  }
  const departurePreview = departurePreviewSnap.data() as Departure;

  const tourSnap = await adminDb().collection("tours").doc(departurePreview.tourId).get();
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

  try {
    await adminDb().runTransaction(async (tx) => {
      const departureSnap = await tx.get(departureRef);
      if (!departureSnap.exists) {
        throw new BookingError("departureId", "This departure is no longer available.");
      }
      const departure = departureSnap.data() as Departure;
      const seatsLeft =
        departure.capacityTotal - departure.capacityBooked - departure.capacityHeld;

      if (departure.status !== "open" || new Date(departure.startDate).getTime() < Date.now()) {
        throw new BookingError("departureId", "This departure is no longer open for registration.");
      }
      if (seatsLeft < travelerCount) {
        throw new BookingError(
          "departureId",
          seatsLeft <= 0
            ? "This departure is sold out."
            : `Only ${seatsLeft} spot${seatsLeft === 1 ? "" : "s"} left on this departure — reduce your party size or choose another date.`
        );
      }

      tx.set(bookingRef, booking);
      for (const traveler of data.travelers) {
        const travelerRef = bookingRef.collection("travelers").doc();
        const travelerDoc: Traveler = { travelerId: travelerRef.id, ...traveler };
        tx.set(travelerRef, travelerDoc);
      }
      tx.update(departureRef, { capacityBooked: departure.capacityBooked + travelerCount });
    });
  } catch (err) {
    if (err instanceof BookingError) {
      return { ok: false, errors: { [err.field]: [err.message] } };
    }
    throw err;
  }

  return { ok: true, bookingId: bookingRef.id };
}
