"use client";

import { useEffect } from "react";
import { markDepartureBookingsViewed } from "@/lib/actions/bookings";

/**
 * Fires the "mark as viewed" server action once this departure's registrant
 * list has actually rendered client-side — revalidatePath can't run during
 * a Server Component's render pass, so this has to be a client-triggered
 * effect rather than an awaited call in the page itself.
 */
export default function MarkDepartureViewed({
  tourId,
  departureId,
}: {
  tourId: string;
  departureId: string;
}) {
  useEffect(() => {
    markDepartureBookingsViewed(tourId, departureId);
  }, [tourId, departureId]);

  return null;
}
