/**
 * Master switch for card payment in the public booking flow. Off while
 * Stripe isn't set up: BookingForm skips the "pay online" choice and every
 * registration is a callback request (staff arrange payment by phone), and
 * createBooking coerces any "pay_online" submission to "callback".
 *
 * Flip to true once Stripe keys and the webhook are configured — the full
 * card flow (DepositPaymentForm, createDepositPaymentIntent) is still in place.
 */
export const ONLINE_PAYMENTS_ENABLED = false;
