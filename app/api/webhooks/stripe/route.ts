import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeServer } from "@/lib/stripe/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendPaymentReceiptEmail } from "@/lib/email/send";
import type { Booking, Payment } from "@/lib/types";

/**
 * Single source of truth for "payment received" (PRD FR-17) — the browser
 * confirming a PaymentIntent (via Stripe Elements, embedded in the booking
 * flow or the token-gated /pay/[bookingId] balance page) is never trusted to
 * mean payment succeeded; only a verified webhook event updates
 * booking.status. Handles both the customer's first payment (deposit,
 * partial, or full — see the payment slider in BookingForm) and a later
 * balance top-up.
 *
 * Idempotent via webhookEvents/{event.id}: Stripe retries delivery on
 * anything but a fast 2xx, so the same event can arrive more than once.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripeServer().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = paymentIntent.metadata.bookingId;

    if (!bookingId) {
      console.error(`Stripe event ${event.id}: payment_intent.succeeded with no bookingId metadata`);
    } else {
      const paymentType = paymentIntent.metadata.paymentType === "balance" ? "balance" : "initial";
      const result = await recordPayment(event.id, bookingId, paymentIntent, paymentType);
      if (result.recorded) {
        await sendPaymentReceiptEmail({
          booking: result.booking,
          amount: result.amount,
          providerRef: paymentIntent.id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

type RecordPaymentResult =
  | { recorded: false }
  | { recorded: true; booking: Booking; amount: number };

async function recordPayment(
  eventId: string,
  bookingId: string,
  paymentIntent: Stripe.PaymentIntent,
  paymentType: "initial" | "balance"
): Promise<RecordPaymentResult> {
  const bookingRef = adminDb().collection("bookings").doc(bookingId);
  const webhookEventRef = adminDb().collection("webhookEvents").doc(eventId);

  return adminDb().runTransaction(async (tx): Promise<RecordPaymentResult> => {
    const [eventSnap, bookingSnap] = await Promise.all([
      tx.get(webhookEventRef),
      tx.get(bookingRef),
    ]);

    // Already handled a previous delivery of this exact event — no-op.
    if (eventSnap.exists) return { recorded: false };

    if (!bookingSnap.exists) {
      tx.set(webhookEventRef, {
        processedAt: new Date().toISOString(),
        note: `booking ${bookingId} not found`,
      });
      return { recorded: false };
    }

    const booking = bookingSnap.data() as Booking;
    const amountPaid = paymentIntent.amount / 100;
    const newAmountPaid = booking.amountPaid + amountPaid;
    const newBalanceAmount = Math.max(0, booking.priceBreakdown.grandTotal - newAmountPaid);
    const status = newBalanceAmount <= 0 ? "paid_in_full" : "partial_paid";

    tx.update(bookingRef, {
      status,
      amountPaid: newAmountPaid,
      balanceAmount: newBalanceAmount,
      paymentProvider: "stripe",
      paymentIntentId: paymentIntent.id,
      updatedAt: new Date().toISOString(),
    });

    const paymentRef = bookingRef.collection("payments").doc();
    const payment: Payment = {
      paymentId: paymentRef.id,
      bookingId,
      amount: amountPaid,
      type: paymentType === "balance" ? "balance" : newBalanceAmount <= 0 ? "full" : "deposit",
      providerRef: paymentIntent.id,
      createdAt: new Date().toISOString(),
    };
    tx.set(paymentRef, payment);

    tx.set(webhookEventRef, { processedAt: new Date().toISOString(), bookingId });

    return {
      recorded: true,
      booking: { ...booking, amountPaid: newAmountPaid, balanceAmount: newBalanceAmount, status },
      amount: amountPaid,
    };
  });
}
