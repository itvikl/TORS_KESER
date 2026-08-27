import "server-only";
import type { Booking, Departure, Tour } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";
import { getDeparturesForTour } from "@/lib/data/tours";

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

/** All departures across every tour — used by the manual-booking form's tour→departure picker. */
export async function getAllDeparturesAdmin(): Promise<Departure[]> {
  const snapshot = await adminDb().collection("departures").get();
  return snapshot.docs.map((doc) => doc.data() as Departure);
}

/**
 * A single departure's registrants — reuses the same in-memory join as
 * getAllBookingsAdmin rather than a second query shape.
 */
export async function getBookingsForDepartureAdmin(
  tourId: string,
  departureId: string
): Promise<AdminBookingRow[]> {
  const rows = await getAllBookingsAdmin();
  return rows.filter(
    (row) => row.booking.tourId === tourId && row.booking.departureId === departureId
  );
}

/** A single tour's registrants across all its departures — used for the tour-level Excel export. */
export async function getBookingsForTourAdmin(tourId: string): Promise<AdminBookingRow[]> {
  const rows = await getAllBookingsAdmin();
  return rows.filter((row) => row.booking.tourId === tourId);
}

export interface TourBookingSummary {
  tourId: string;
  tour?: Tour;
  registrantCount: number;
  travelerCount: number;
  /** Registrations that haven't been opened yet (see markDepartureBookingsViewed) — drives the red "new" badge. */
  newCount: number;
}

/** Registrant counts grouped by tour, for the admin bookings landing page. */
export async function getBookingCountsByTourAdmin(): Promise<TourBookingSummary[]> {
  const rows = await getAllBookingsAdmin();
  const byTour = new Map<string, TourBookingSummary>();

  for (const row of rows) {
    const existing = byTour.get(row.booking.tourId);
    if (existing) {
      existing.registrantCount += 1;
      existing.travelerCount += row.booking.travelerCount;
      if (!row.booking.viewedAt) existing.newCount += 1;
    } else {
      byTour.set(row.booking.tourId, {
        tourId: row.booking.tourId,
        tour: row.tour,
        registrantCount: 1,
        travelerCount: row.booking.travelerCount,
        newCount: row.booking.viewedAt ? 0 : 1,
      });
    }
  }

  return Array.from(byTour.values()).sort((a, b) => b.registrantCount - a.registrantCount);
}

export interface DepartureBookingSummary {
  departure: Departure;
  registrantCount: number;
  travelerCount: number;
  newCount: number;
}

/**
 * Registrant counts per departure for a single tour — includes every
 * planned departure (even ones with zero bookings yet), mirroring the
 * tour's Departures admin page.
 */
export async function getBookingCountsByDepartureForTourAdmin(
  tourId: string
): Promise<DepartureBookingSummary[]> {
  const [departures, rows] = await Promise.all([
    getDeparturesForTour(tourId),
    getBookingsForTourAdmin(tourId),
  ]);

  const countsByDeparture = new Map<
    string,
    { registrantCount: number; travelerCount: number; newCount: number }
  >();
  for (const row of rows) {
    const existing = countsByDeparture.get(row.booking.departureId);
    if (existing) {
      existing.registrantCount += 1;
      existing.travelerCount += row.booking.travelerCount;
      if (!row.booking.viewedAt) existing.newCount += 1;
    } else {
      countsByDeparture.set(row.booking.departureId, {
        registrantCount: 1,
        travelerCount: row.booking.travelerCount,
        newCount: row.booking.viewedAt ? 0 : 1,
      });
    }
  }

  return departures.map((departure) => ({
    departure,
    registrantCount: countsByDeparture.get(departure.departureId)?.registrantCount ?? 0,
    travelerCount: countsByDeparture.get(departure.departureId)?.travelerCount ?? 0,
    newCount: countsByDeparture.get(departure.departureId)?.newCount ?? 0,
  }));
}
