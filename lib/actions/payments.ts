"use server";

import { stripeServer } from "@/lib/stripe/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Booking } from "@/lib/types";

export type CreateDepositIntentResult =
  | { ok: true; clientSecret: string }
  | { ok: false; error: string };

/**
 * Creates (or reuses) the Stripe PaymentIntent for a booking's deposit.
 * Booking status only ever changes via the webhook (PRD FR-17) — this just
 * gets the client a clientSecret to collect the card with Stripe Elements.
 */
export async function createDepositPaymentIntent(
  bookingId: string
): Promise<CreateDepositIntentResult> {
  const bookingRef = adminDb().collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) {
    return { ok: false, error: "Booking not found." };
  }

  const booking = snap.data() as Booking;
  if (booking.status !== "pending_payment") {
    return { ok: false, error: "This booking is no longer awaiting payment." };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { ok: false, error: "Online payment isn't configured yet." };
  }

  try {
    const stripe = stripeServer();

    if (booking.paymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
      if (
        (existing.status === "requires_payment_method" ||
          existing.status === "requires_confirmation") &&
        existing.client_secret
      ) {
        return { ok: true, clientSecret: existing.client_secret };
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.depositAmount * 100),
      currency: "usd",
      metadata: { bookingId },
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

    return { ok: true, clientSecret: paymentIntent.client_secret };
  } catch (err) {
    console.error("Stripe PaymentIntent creation failed:", err);
    return { ok: false, error: "Could not start payment. Please try again." };
  }
}
