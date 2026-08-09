"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/dal";
import { calculatePriceBreakdown } from "@/lib/pricing";
import { BookingInputSchema, ManualBookingInputSchema } from "@/lib/validation/booking";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import { stripeServer } from "@/lib/stripe/server";
import type { Booking, BookingStatus, Departure, Tour, Traveler } from "@/lib/types";
import type { BookingInput } from "@/lib/validation/booking";

export type GetBookingTravelersResult =
  | { ok: true; travelers: Traveler[] }
  | { ok: false; error: string };

export type CreateBookingResult =
  | { ok: true; bookingId: string; checkoutUrl?: string }
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
  | { ok: true; bookingId: string; tour: Tour; depositAmount: number }
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

  return { ok: true, bookingId: bookingRef.id, tour, depositAmount };
}

/**
 * Public, unauthenticated action — anyone can submit a registration (no
 * customer account system exists yet). No payment happens here: every
 * booking is written as `pending_payment` regardless of the customer's
 * chosen contactPreference (callback vs. pay online), since Stripe isn't
 * wired up. Staff follow up from /admin/bookings either way.
 */
export async function createBooking(input: unknown): Promise<CreateBookingResult> {
  const parsed = BookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }

  const core = await createBookingCore(parsed.data, "pending_payment");
  if (!core.ok) return core;

  const checkoutUrl =
    parsed.data.contactPreference === "pay_online" && core.depositAmount > 0
      ? await tryCreateCheckoutSession(core.bookingId, core.tour, core.depositAmount)
      : undefined;

  return { ok: true, bookingId: core.bookingId, checkoutUrl };
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

/**
 * Best-effort: the booking above has already been saved successfully by
 * the time this runs. If Stripe isn't configured yet (no
 * STRIPE_SECRET_KEY) or the API call fails, we just skip the redirect —
 * the registration itself still went through and staff follow up from
 * /admin/bookings, same as the "callback" path.
 */
async function tryCreateCheckoutSession(
  bookingId: string,
  tour: Tour,
  depositAmount: number
): Promise<string | undefined> {
  if (!process.env.STRIPE_SECRET_KEY) return undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripeServer().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Deposit — ${tour.title}` },
            unit_amount: Math.round(depositAmount * 100),
          },
          quantity: 1,
        },
      ],
      // The webhook (app/api/webhooks/stripe/route.ts) reads this back off
      // the completed session to know which booking to mark paid — it's
      // the only link between the Stripe side and our booking doc.
      metadata: { bookingId },
      success_url: `${siteUrl}/tours/${tour.slug}/book/success?booking=${bookingId}`,
      cancel_url: `${siteUrl}/tours/${tour.slug}/book`,
    });
    return session.url ?? undefined;
  } catch (err) {
    console.error("Stripe Checkout session creation failed:", err);
    return undefined;
  }
}
