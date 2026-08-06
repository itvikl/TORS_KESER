import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { Booking, BookingStatus } from "@/lib/types";

export interface PublicBookingSummary {
  status: BookingStatus;
  grandTotal: number;
  depositAmount: number;
  amountPaid: number;
}

/**
 * Minimal, non-PII slice of a booking for the post-checkout success page —
 * deliberately does NOT return contact info or traveler records, since this
 * page is reachable by anyone who has the URL Stripe redirected them to.
 */
export async function getBookingSummary(bookingId: string): Promise<PublicBookingSummary | null> {
  const snap = await adminDb().collection("bookings").doc(bookingId).get();
  if (!snap.exists) return null;

  const booking = snap.data() as Booking;
  return {
    status: booking.status,
    grandTotal: booking.priceBreakdown.grandTotal,
    depositAmount: booking.depositAmount,
    amountPaid: booking.amountPaid,
  };
}
