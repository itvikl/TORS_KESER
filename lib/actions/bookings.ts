"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/dal";
import { calculatePriceBreakdown } from "@/lib/pricing";
import { ManualBookingInputSchema, PublicBookingInputSchema } from "@/lib/validation/booking";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import { stripeServer } from "@/lib/stripe/server";
import type { Booking, BookingStatus, Departure, Tour, Traveler } from "@/lib/types";
import type { BookingInput } from "@/lib/validation/booking";

function generatePaymentLinkToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * How createBookingCore should decide the booking's initial status and how
 * much the customer is being charged right now:
 * - "public": no Stripe leg has run yet — status is always pending_payment,
 *   and `requestedAmount` (from the payment slider) is validated against the
 *   departure's bookingAssurance + [depositAmount, grandTotal] range, never
 *   trusted outright (PRD FR-13; see coral-wandering-lantern.md D8 — an
 *   out-of-range amount is rejected, not silently clamped).
 * - "manual": staff pick the status directly (a phone booking may already be
 *   paid off-platform) — no assurance check, amount is derived from status.
 */
type PaymentResolution =
  | { mode: "public"; requestedAmount: number }
  | { mode: "manual"; status: BookingStatus };

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
  resolution: PaymentResolution
): Promise<
  | { ok: true; bookingId: string; tour: Tour; initialPaymentAmount: number }
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

  let status: BookingStatus;
  let initialPaymentAmount: number;

  if (resolution.mode === "public") {
    // No Stripe leg has run at this point regardless of assurance — the
    // webhook is the only thing allowed to mark a payment as received.
    status = "pending_payment";
    if (departurePreview.bookingAssurance === "guaranteed") {
      // Never trust the client's slider value here — a guaranteed departure
      // always requires the full price, no matter what was submitted.
      initialPaymentAmount = priceBreakdown.grandTotal;
    } else if (
      resolution.requestedAmount < depositAmount ||
      resolution.requestedAmount > priceBreakdown.grandTotal
    ) {
      return {
        ok: false,
        errors: {
          paymentAmount: [
            `Choose an amount between $${depositAmount} and $${priceBreakdown.grandTotal}.`,
          ],
        },
      };
    } else {
      initialPaymentAmount = resolution.requestedAmount;
    }
  } else {
    status = resolution.status;
    initialPaymentAmount =
      status === "paid_in_full" ? priceBreakdown.grandTotal : status === "partial_paid" ? depositAmount : 0;
  }

  const amountPaid = status === "pending_payment" ? 0 : initialPaymentAmount;
  const balanceAmount = Math.max(0, priceBreakdown.grandTotal - amountPaid);

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
    initialPaymentAmount,
    balanceAmount,
    amountPaid,
    status,
    paymentLinkToken: generatePaymentLinkToken(),
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

  return { ok: true, bookingId: bookingRef.id, tour, initialPaymentAmount };
}

/**
 * Public, unauthenticated action — anyone can submit a registration (no
 * customer account system exists yet). No payment happens here: every
 * booking is written as `pending_payment` regardless of the customer's
 * chosen contactPreference (callback vs. pay online), since Stripe isn't
 * wired up. Staff follow up from /admin/bookings either way.
 */
export async function createBooking(input: unknown): Promise<CreateBookingResult> {
  const parsed = PublicBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }

  const core = await createBookingCore(parsed.data, {
    mode: "public",
    requestedAmount: parsed.data.paymentAmount,
  });
  if (!core.ok) return core;

  const checkoutUrl =
    parsed.data.contactPreference === "pay_online" && core.initialPaymentAmount > 0
      ? await tryCreateCheckoutSession(core.bookingId, core.tour, core.initialPaymentAmount, "initial")
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
  const core = await createBookingCore(bookingInput, { mode: "manual", status });
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

export type GetBookingByPaymentLinkResult =
  | { ok: true; booking: Booking; tour: Tour; departure: Departure }
  | { ok: false; error: string };

/**
 * Public, token-gated lookup for /pay/[bookingId] — the token is a random
 * value stored on the booking at creation time, not a login/session. A
 * mismatch returns the same generic error as "not found" so the response
 * can't be used to enumerate valid booking IDs or tokens (see
 * coral-wandering-lantern.md D4).
 */
export async function getBookingByPaymentLink(
  bookingId: string,
  token: string
): Promise<GetBookingByPaymentLinkResult> {
  const bookingSnap = await adminDb().collection("bookings").doc(bookingId).get();
  if (!bookingSnap.exists) {
    return { ok: false, error: "This payment link is invalid or has expired." };
  }
  const booking = bookingSnap.data() as Booking;
  if (booking.paymentLinkToken !== token) {
    return { ok: false, error: "This payment link is invalid or has expired." };
  }

  const [tourSnap, departureSnap] = await Promise.all([
    adminDb().collection("tours").doc(booking.tourId).get(),
    adminDb().collection("departures").doc(booking.departureId).get(),
  ]);
  if (!tourSnap.exists || !departureSnap.exists) {
    return { ok: false, error: "This booking's tour or departure is no longer available." };
  }

  return {
    ok: true,
    booking,
    tour: tourSnap.data() as Tour,
    departure: departureSnap.data() as Departure,
  };
}

export type CreateBalanceCheckoutResult = { ok: true; checkoutUrl: string } | { ok: false; error: string };

/**
 * Re-verifies the token server-side (never trusts that the page already
 * checked it) before creating a new Stripe Checkout session for whatever
 * balance remains — used by the "Pay $X now" button on /pay/[bookingId].
 */
export async function createBalanceCheckoutSession(
  bookingId: string,
  token: string
): Promise<CreateBalanceCheckoutResult> {
  const lookup = await getBookingByPaymentLink(bookingId, token);
  if (!lookup.ok) return { ok: false, error: lookup.error };

  const { booking, tour } = lookup;
  if (booking.status === "cancelled" || booking.status === "refunded") {
    return { ok: false, error: "This booking is no longer active." };
  }
  if (booking.balanceAmount <= 0) {
    return { ok: false, error: "This booking is already paid in full." };
  }

  const checkoutUrl = await tryCreateCheckoutSession(bookingId, tour, booking.balanceAmount, "balance");
  if (!checkoutUrl) {
    return { ok: false, error: "Couldn't start checkout — please try again in a moment." };
  }
  return { ok: true, checkoutUrl };
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
  amount: number,
  paymentType: "initial" | "balance"
): Promise<string | undefined> {
  if (!process.env.STRIPE_SECRET_KEY) return undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const productLabel = paymentType === "initial" ? "Initial payment" : "Balance payment";
  const cancelUrl =
    paymentType === "initial"
      ? `${siteUrl}/tours/${tour.slug}/book`
      : `${siteUrl}/pay/${bookingId}`;

  try {
    const session = await stripeServer().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${productLabel} — ${tour.title}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      // The webhook (app/api/webhooks/stripe/route.ts) reads this back off
      // the completed session to know which booking to mark paid and
      // whether it was the first payment or a balance top-up — it's the
      // only link between the Stripe side and our booking doc.
      metadata: { bookingId, paymentType },
      success_url: `${siteUrl}/tours/${tour.slug}/book/success?booking=${bookingId}`,
      cancel_url: cancelUrl,
    });
    return session.url ?? undefined;
  } catch (err) {
    console.error("Stripe Checkout session creation failed:", err);
    return undefined;
  }
}
