import "server-only";
import type { Booking, Departure, Tour, Traveler } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";

export interface PastDepartureRow {
  departure: Departure;
  tour?: Tour;
  registrantCount: number;
}

/** Same in-memory join pattern as lib/data/admin/bookings.ts — collections are small. */
export async function getPastDeparturesAdmin(): Promise<PastDepartureRow[]> {
  const [departuresSnap, toursSnap, bookingsSnap] = await Promise.all([
    adminDb().collection("departures").get(),
    adminDb().collection("tours").get(),
    adminDb().collection("bookings").get(),
  ]);

  const tourById = new Map(toursSnap.docs.map((doc) => [doc.id, doc.data() as Tour]));
  const bookings = bookingsSnap.docs.map((doc) => doc.data() as Booking);

  const now = Date.now();
  const pastDepartures = departuresSnap.docs
    .map((doc) => doc.data() as Departure)
    .filter((departure) => new Date(departure.endDate).getTime() < now);

  const rows: PastDepartureRow[] = pastDepartures.map((departure) => {
    const registrantCount = bookings
      .filter((b) => b.departureId === departure.departureId && b.status !== "cancelled")
      .reduce((sum, b) => sum + b.travelerCount, 0);
    return { departure, tour: tourById.get(departure.tourId), registrantCount };
  });

  rows.sort((a, b) => b.departure.startDate.localeCompare(a.departure.startDate));
  return rows;
}

export interface DepartureRegistrant {
  booking: Booking;
  travelers: Traveler[];
}

export interface DepartureRegistrantsResult {
  departure: Departure | null;
  tour: Tour | null;
  registrants: DepartureRegistrant[];
}

/** Registrants = bookings on this departure, each with its travelers subcollection. */
export async function getDepartureRegistrantsAdmin(
  departureId: string
): Promise<DepartureRegistrantsResult> {
  const departureSnap = await adminDb().collection("departures").doc(departureId).get();
  if (!departureSnap.exists) {
    return { departure: null, tour: null, registrants: [] };
  }
  const departure = departureSnap.data() as Departure;

  const [tourSnap, bookingsSnap] = await Promise.all([
    adminDb().collection("tours").doc(departure.tourId).get(),
    adminDb().collection("bookings").where("departureId", "==", departureId).get(),
  ]);
  const tour = tourSnap.exists ? (tourSnap.data() as Tour) : null;

  const registrants = await Promise.all(
    bookingsSnap.docs.map(async (doc) => {
      const booking = doc.data() as Booking;
      const travelersSnap = await doc.ref.collection("travelers").get();
      const travelers = travelersSnap.docs.map((t) => t.data() as Traveler);
      return { booking, travelers };
    })
  );

  registrants.sort((a, b) => a.booking.contactName.localeCompare(b.booking.contactName));
  return { departure, tour, registrants };
}
