"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/dal";
import { calculatePriceBreakdown } from "@/lib/pricing";
import { sendBookingConfirmationEmail } from "@/lib/email/send";
import { BookingInputSchema, ManualBookingInputSchema } from "@/lib/validation/booking";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import type { Booking, BookingStatus, Departure, Tour, Traveler } from "@/lib/types";
import type { BookingInput } from "@/lib/validation/booking";

export type GetBookingTravelersResult =
  | { ok: true; travelers: Traveler[] }
  | { ok: false; error: string };

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; errors: Record<string, string[]> };

export type CreateManualBookingResult =
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
 * Shared by the public registration flow and the admin "manual booking"
 * form: looks up the tour/departure, recomputes price server-side (PRD
 * FR-13 — never trust a total from the client), and atomically checks
 * capacity + writes the booking and its travelers subcollection in one
 * Firestore transaction. `status` is the caller's choice — the public flow
 * always passes "pending_payment" (no Stripe leg has run yet at this
 * point); the admin flow lets staff set it directly since a manually
 * entered booking may already be paid (phone/check).
 */
async function createBookingCore(
  data: BookingInput,
  status: BookingStatus
): Promise<
  | { ok: true; bookingId: string }
  | { ok: false; errors: Record<string, string[]> }
> {
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
    amountPaid: status === "paid_in_full" ? priceBreakdown.grandTotal : status === "deposit_paid" ? depositAmount : 0,
    status,
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
            : `Only ${seatsLeft} spot${seatsLeft === 1 ? "" : "s"} left on this departure — reduce the party size or choose another date.`
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

  await sendBookingConfirmationEmail(booking);

  return { ok: true, bookingId: bookingRef.id };
}

/**
 * Public, unauthenticated action — anyone can submit a registration (no
 * customer account system exists yet). No payment happens here: every
 * booking is written as `pending_payment` regardless of the customer's
 * chosen contactPreference (callback vs. pay online). For pay_online, the
 * caller (BookingForm) follows this up with createDepositPaymentIntent and
 * a Stripe Elements card form; the booking only moves out of
 * `pending_payment` once the webhook confirms the charge (PRD FR-17). For
 * callback, staff follow up from /admin/bookings.
 */
export async function createBooking(input: unknown): Promise<CreateBookingResult> {
  const parsed = BookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }

  return createBookingCore(parsed.data, "pending_payment");
}

/**
 * Admin-only counterpart of createBooking, for registrations staff enter on
 * a customer's behalf (e.g. a phone booking) — same capacity/price
 * enforcement, but skips Stripe entirely and lets staff pick the initial
 * status since payment may already have happened off-platform.
 */
export async function createManualBooking(input: unknown): Promise<CreateManualBookingResult> {
  await requireAdminSession();

  const parsed = ManualBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }

  const { status, ...bookingInput } = parsed.data;
  const core = await createBookingCore(bookingInput, status);
  if (!core.ok) return core;

  revalidatePath("/admin/bookings");
  return { ok: true, bookingId: core.bookingId };
}

/**
 * Fetches a booking's travelers subcollection on demand (e.g. when staff
 * expand a booking's detail card in /admin/bookings) rather than joining it
 * into every row of the list — the list itself already carries every other
 * field the customer entered directly on the Booking doc.
 */
export async function getBookingTravelers(bookingId: string): Promise<GetBookingTravelersResult> {
  await requireAdminSession();

  const snapshot = await adminDb()
    .collection("bookings")
    .doc(bookingId)
    .collection("travelers")
    .get();

  if (snapshot.empty) {
    const bookingSnap = await adminDb().collection("bookings").doc(bookingId).get();
    if (!bookingSnap.exists) {
      return { ok: false, error: "This booking no longer exists." };
    }
  }

  const travelers = snapshot.docs.map((doc) => doc.data() as Traveler);
  return { ok: true, travelers };
}
