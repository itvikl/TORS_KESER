import "server-only";
import Stripe from "stripe";

/**
 * Stripe SERVER SDK — server-only. Used by Server Actions that create
 * PaymentIntents/Checkout Sessions, and by the webhook route handler that
 * is the single source of truth for "payment received" (PRD FR-17).
 */
let stripeSingleton: Stripe | null = null;

export function stripeServer(): Stripe {
  if (stripeSingleton) return stripeSingleton;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  stripeSingleton = new Stripe(secretKey);
  return stripeSingleton;
}
