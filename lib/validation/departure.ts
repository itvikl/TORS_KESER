import * as z from "zod";

/**
 * Admin-editable subset of lib/types.ts Departure. Deliberately excludes
 * departureId/tourId (assigned by the data layer), capacityBooked/
 * capacityHeld (system-managed via the booking transaction — never form
 * input), balanceDueDate (derived server-side from startDate + the tour's
 * pricing), and pricingOverride (deferred — not exposed in this editor yet).
 */
export const DepartureInputSchema = z
  .object({
    startDate: z.string().min(1, { error: "Start date is required." }),
    endDate: z.string().min(1, { error: "End date is required." }),
    capacityTotal: z.number().int().min(0, { error: "Capacity must be 0 or more." }),
    status: z.enum(["open", "closed", "soldout", "cancelled"]),
    // Internal-only signal (see keshertour-trip-validation-plan) — never shown to customers.
    minGroupSizeMet: z.boolean(),
    guideId: z.string().optional(),
    kashrutSupervisorId: z.string().optional(),
    // Customer-facing trust badge — missing/undefined is treated as "conditional".
    bookingAssurance: z.enum(["conditional", "guaranteed"]).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    error: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export type DepartureInput = z.infer<typeof DepartureInputSchema>;
