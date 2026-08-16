"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { DepartureInputSchema } from "@/lib/validation/departure";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import {
  cancelDepartureDoc,
  createDepartureDoc,
  getDepartureByIdAdmin,
  updateDepartureDoc,
} from "@/lib/data/admin/departures";
import { getTourByIdAdmin } from "@/lib/data/admin/tours";
import { HOME_TOURS_CACHE_TAG } from "@/lib/data/homeCacheTags";
import type { Booking } from "@/lib/types";

export interface BalancePaymentLink {
  bookingId: string;
  contactName: string;
  balanceAmount: number;
  url: string;
}

export type SaveDepartureResult =
  | { ok: true; departureId: string; balancePaymentLinks: BalancePaymentLink[] }
  | { ok: false; errors: Record<string, string[] | undefined> };

/**
 * When a departure flips from conditional (or unset) to "guaranteed",
 * customers who already paid something (status partial_paid) owe the rest.
 * No real email infrastructure exists yet, so this just surfaces the
 * affected bookings + their token-secured /pay links for staff to send
 * manually; the same call site is where a real ESP integration would plug
 * in later.
 */
async function findBalancePaymentLinks(departureId: string): Promise<BalancePaymentLink[]> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const snapshot = await adminDb()
    .collection("bookings")
    .where("departureId", "==", departureId)
    .where("status", "==", "partial_paid")
    .get();

  return snapshot.docs.map((doc) => {
    const booking = doc.data() as Booking;
    return {
      bookingId: booking.bookingId,
      contactName: booking.contactName,
      balanceAmount: booking.balanceAmount,
      url: `${siteUrl}/pay/${booking.bookingId}?token=${booking.paymentLinkToken}`,
    };
  });
}

/** startDate minus `days`, as a YYYY-MM-DD string (same date-only format as startDate/endDate). */
function subtractDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export async function saveDeparture(
  input: unknown,
  tourId: string,
  departureId?: string
): Promise<SaveDepartureResult> {
  await requireAdminSession();

  const parsed = DepartureInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodIssuesToFieldErrors(parsed.error.issues) };
  }
  const data = parsed.data;

  const tour = await getTourByIdAdmin(tourId);
  if (!tour) {
    return { ok: false, errors: { startDate: ["This tour no longer exists."] } };
  }

  const balanceDueDate = subtractDays(data.startDate, tour.pricing.balanceDueDaysBeforeDeparture);

  let savedId: string;
  let justBecameGuaranteed = false;
  if (departureId) {
    const existing = await getDepartureByIdAdmin(departureId);
    if (!existing) {
      return { ok: false, errors: { startDate: ["This departure no longer exists."] } };
    }
    const alreadyCommitted = existing.capacityBooked + existing.capacityHeld;
    if (data.capacityTotal < alreadyCommitted) {
      return {
        ok: false,
        errors: {
          capacityTotal: [
            `Can't be lower than ${alreadyCommitted} — that many seats are already booked or held.`,
          ],
        },
      };
    }
    justBecameGuaranteed =
      existing.bookingAssurance !== "guaranteed" && data.bookingAssurance === "guaranteed";
    savedId = await updateDepartureDoc(departureId, tourId, data, balanceDueDate, existing);
  } else {
    savedId = await createDepartureDoc(tourId, data, balanceDueDate);
  }

  revalidatePath(`/admin/tours/${tourId}/departures`);
  revalidatePath(`/admin/tours/${tourId}/departures/${savedId}`);
  revalidatePath("/admin/tours");
  revalidatePath(`/tours/${tour.slug}`);
  revalidatePath(`/tours/${tour.slug}/book`);
  updateTag(HOME_TOURS_CACHE_TAG);

  const balancePaymentLinks = justBecameGuaranteed ? await findBalancePaymentLinks(savedId) : [];

  return { ok: true, departureId: savedId, balancePaymentLinks };
}

export async function cancelDeparture(departureId: string, tourId: string): Promise<void> {
  await requireAdminSession();
  await cancelDepartureDoc(departureId);
  revalidatePath(`/admin/tours/${tourId}/departures`);
  revalidatePath("/admin/tours");
  updateTag(HOME_TOURS_CACHE_TAG);
}
