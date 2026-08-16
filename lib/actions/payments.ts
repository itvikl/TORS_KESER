"use server";

import { stripeServer } from "@/lib/stripe/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Booking } from "@/lib/types";

export type CreatePaymentIntentResult =
  | { ok: true; clientSecret: string; amount: number }
  | { ok: false; error: string };

/**
 * Creates (or reuses) a Stripe PaymentIntent for the given amount. Booking
 * status only ever changes via the webhook (PRD FR-17) — this just gets the
 * client a clientSecret to collect the card with Stripe Elements. Reuse is
 * skipped if the amount doesn't match the existing intent — that can happen
 * if, e.g., the customer's party size (and therefore price) changed between
 * page loads.
 */
async function createPaymentIntentForAmount(
  bookingRef: FirebaseFirestore.DocumentReference,
  booking: Booking,
  amount: number,
  paymentType: "initial" | "balance"
): Promise<CreatePaymentIntentResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { ok: false, error: "Online payment isn't configured yet." };
  }

  try {
    const stripe = stripeServer();
    const amountCents = Math.round(amount * 100);

    if (booking.paymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
      if (
        (existing.status === "requires_payment_method" ||
          existing.status === "requires_confirmation") &&
        existing.client_secret &&
        existing.amount === amountCents
      ) {
        return { ok: true, clientSecret: existing.client_secret, amount };
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: { bookingId: booking.bookingId, paymentType },
      automatic_payment_methods: { enabled: true },
    });

    if (!paymentIntent.client_secret) {
      return { ok: false, error: "Could not start payment. Please try again." };
    }

    await bookingRef.update({
      paymentProvider: "stripe",
      paymentIntentId: paymentIntent.id,
      updatedAt: new Date().toISOString(),
    });

    return { ok: true, clientSecret: paymentIntent.client_secret, amount };
  } catch (err) {
    console.error("Stripe PaymentIntent creation failed:", err);
    return { ok: false, error: "Could not start payment. Please try again." };
  }
}

/**
 * Creates the Stripe PaymentIntent for a booking's first payment — the
 * amount is whatever the customer chose (or was forced into, for a
 * guaranteed departure) at booking time, per booking.initialPaymentAmount.
 */
export async function createDepositPaymentIntent(
  bookingId: string
): Promise<CreatePaymentIntentResult> {
  const bookingRef = adminDb().collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) {
    return { ok: false, error: "Booking not found." };
  }

  const booking = snap.data() as Booking;
  if (booking.status !== "pending_payment") {
    return { ok: false, error: "This booking is no longer awaiting payment." };
  }

  return createPaymentIntentForAmount(bookingRef, booking, booking.initialPaymentAmount, "initial");
}

/**
 * Token-gated counterpart for /pay/[bookingId] — creates a PaymentIntent for
 * whatever balance remains. The token is re-verified here (never trusts
 * that the caller already checked it).
 */
export async function createBalancePaymentIntent(
  bookingId: string,
  token: string
): Promise<CreatePaymentIntentResult> {
  const bookingRef = adminDb().collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) {
    return { ok: false, error: "This payment link is invalid or has expired." };
  }

  const booking = snap.data() as Booking;
  if (booking.paymentLinkToken !== token) {
    return { ok: false, error: "This payment link is invalid or has expired." };
  }
  if (booking.status === "cancelled" || booking.status === "refunded") {
    return { ok: false, error: "This booking is no longer active." };
  }
  if (booking.balanceAmount <= 0) {
    return { ok: false, error: "This booking is already paid in full." };
  }

  return createPaymentIntentForAmount(bookingRef, booking, booking.balanceAmount, "balance");
}
