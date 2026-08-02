import "server-only";
import type { Booking, Departure, Tour } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";

export interface AdminBookingRow {
  booking: Booking;
  tour?: Tour;
  departure?: Departure;
}

/**
 * Joins bookings with their tour/departure in memory rather than N+1
 * queries — both collections are small (see lib/data/tours.ts for the same
 * pattern), so one full read of each is cheaper than a query per booking.
 */
export async function getAllBookingsAdmin(): Promise<AdminBookingRow[]> {
  const [bookingsSnap, toursSnap, departuresSnap] = await Promise.all([
    adminDb().collection("bookings").get(),
    adminDb().collection("tours").get(),
    adminDb().collection("departures").get(),
  ]);

  const tourById = new Map(toursSnap.docs.map((doc) => [doc.id, doc.data() as Tour]));
  const departureById = new Map(
    departuresSnap.docs.map((doc) => [doc.id, doc.data() as Departure])
  );

  const rows: AdminBookingRow[] = bookingsSnap.docs.map((doc) => {
    const booking = doc.data() as Booking;
    return {
      booking,
      tour: tourById.get(booking.tourId),
      departure: departureById.get(booking.departureId),
    };
  });

  rows.sort((a, b) => b.booking.createdAt.localeCompare(a.booking.createdAt));
  return rows;
}
