"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/dal";
import { DepartureInputSchema } from "@/lib/validation/departure";
import { zodIssuesToFieldErrors } from "@/lib/validation/zodErrors";
import {
  cancelDepartureDoc,
  createDepartureDoc,
  getDepartureByIdAdmin,
  updateDepartureDoc,
} from "@/lib/data/admin/departures";
import { getTourByIdAdmin } from "@/lib/data/admin/tours";

export type SaveDepartureResult =
  | { ok: true; departureId: string }
  | { ok: false; errors: Record<string, string[] | undefined> };

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
    savedId = await updateDepartureDoc(departureId, tourId, data, balanceDueDate, existing);
  } else {
    savedId = await createDepartureDoc(tourId, data, balanceDueDate);
  }

  revalidatePath(`/admin/tours/${tourId}/departures`);
  revalidatePath(`/admin/tours/${tourId}/departures/${savedId}`);
  revalidatePath("/admin/tours");
  revalidatePath(`/tours/${tour.slug}`);
  revalidatePath(`/tours/${tour.slug}/book`);

  return { ok: true, departureId: savedId };
}

export async function cancelDeparture(departureId: string, tourId: string): Promise<void> {
  await requireAdminSession();
  await cancelDepartureDoc(departureId);
  revalidatePath(`/admin/tours/${tourId}/departures`);
  revalidatePath("/admin/tours");
}
