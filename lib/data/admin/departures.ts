import "server-only";
import type { Departure } from "@/lib/types";
import type { DepartureInput } from "@/lib/validation/departure";
import { adminDb } from "@/lib/firebase/admin";

const DEPARTURES_COLLECTION = "departures";

export async function getDepartureByIdAdmin(departureId: string): Promise<Departure | null> {
  const doc = await adminDb().collection(DEPARTURES_COLLECTION).doc(departureId).get();
  return doc.exists ? (doc.data() as Departure) : null;
}

export async function createDepartureDoc(
  tourId: string,
  input: DepartureInput,
  balanceDueDate: string
): Promise<string> {
  const ref = adminDb().collection(DEPARTURES_COLLECTION).doc();
  const departure: Departure = {
    ...input,
    departureId: ref.id,
    tourId,
    balanceDueDate,
    capacityBooked: 0,
    capacityHeld: 0,
  };
  await ref.set(departure);
  return ref.id;
}

/** capacityBooked/capacityHeld are never taken from `input` — only the booking transaction (lib/actions/bookings.ts) is allowed to change them. */
export async function updateDepartureDoc(
  departureId: string,
  tourId: string,
  input: DepartureInput,
  balanceDueDate: string,
  existing: Departure
): Promise<string> {
  const ref = adminDb().collection(DEPARTURES_COLLECTION).doc(departureId);
  const departure: Departure = {
    ...input,
    departureId,
    tourId,
    balanceDueDate,
    capacityBooked: existing.capacityBooked,
    capacityHeld: existing.capacityHeld,
  };
  await ref.set(departure);
  return departureId;
}

export async function cancelDepartureDoc(departureId: string): Promise<void> {
  await adminDb().collection(DEPARTURES_COLLECTION).doc(departureId).update({ status: "cancelled" });
}
