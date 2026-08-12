import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeServer } from "@/lib/stripe/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Booking, Payment } from "@/lib/types";

/**
 * Single source of truth for "payment received" (PRD FR-17) — a client-side
 * redirect back from Stripe is never trusted to mean payment succeeded;
 * only a verified webhook event updates booking.status. Handles both the
 * customer's first payment (deposit or full, on the public flow) and a
 * later balance top-up from /pay/[bookingId] — see
 * coral-wandering-lantern.md for the flexible-payment-amount spec.
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      console.error(`Stripe event ${event.id}: checkout.session.completed with no bookingId metadata`);
    } else {
      const paymentType = session.metadata?.paymentType === "balance" ? "balance" : "initial";
      await recordPayment(event.id, bookingId, session, paymentType);
    }
  }

  return NextResponse.json({ received: true });
}

async function recordPayment(
  eventId: string,
  bookingId: string,
  session: Stripe.Checkout.Session,
  paymentType: "initial" | "balance"
) {
  const bookingRef = adminDb().collection("bookings").doc(bookingId);
  const webhookEventRef = adminDb().collection("webhookEvents").doc(eventId);

  await adminDb().runTransaction(async (tx) => {
    const [eventSnap, bookingSnap] = await Promise.all([
      tx.get(webhookEventRef),
      tx.get(bookingRef),
    ]);

    // Already handled a previous delivery of this exact event — no-op.
    if (eventSnap.exists) return;

    if (!bookingSnap.exists) {
      tx.set(webhookEventRef, {
        processedAt: new Date().toISOString(),
        note: `booking ${bookingId} not found`,
      });
      return;
    }

    const booking = bookingSnap.data() as Booking;
    const paidNow = (session.amount_total ?? 0) / 100;
    const newAmountPaid = booking.amountPaid + paidNow;
    const newBalanceAmount = Math.max(0, booking.priceBreakdown.grandTotal - newAmountPaid);
    const newStatus = newBalanceAmount <= 0 ? "paid_in_full" : "partial_paid";
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : undefined;

    tx.update(bookingRef, {
      status: newStatus,
      amountPaid: newAmountPaid,
      balanceAmount: newBalanceAmount,
      paymentProvider: "stripe",
      paymentIntentId,
      updatedAt: new Date().toISOString(),
    });

    const paymentRef = bookingRef.collection("payments").doc();
    const payment: Payment = {
      paymentId: paymentRef.id,
      bookingId,
      amount: paidNow,
      type: paymentType === "initial" ? "deposit" : "balance",
      providerRef: paymentIntentId ?? session.id,
      createdAt: new Date().toISOString(),
    };
    tx.set(paymentRef, payment);

    tx.set(webhookEventRef, { processedAt: new Date().toISOString(), bookingId });
  });
}
