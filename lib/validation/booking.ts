import * as z from "zod";

export const RoomConfigurationSchema = z.object({
  doubleRooms: z.number().int().min(0),
  singleRooms: z.number().int().min(0),
  triples: z.number().int().min(0),
});

export const TravelerInputSchema = z.object({
  firstName: z.string().min(1, { error: "First name is required." }),
  lastName: z.string().min(1, { error: "Last name is required." }),
  dob: z.string().optional(),
  passport: z.string().optional(),
  occupancy: z.enum(["double", "single", "triple", "child"]),
  roomWith: z.string().optional(),
  dietary: z.string().optional(),
});

/**
 * Everything the public registration form (components/marketing/BookingForm)
 * submits. No pricing fields here on purpose — the server action recomputes
 * the price from the tour/departure's own data (PRD FR-13), never trusting
 * a total sent by the client.
 */
export const BookingInputSchema = z.object({
  departureId: z.string().min(1, { error: "Choose a departure date." }),
  roomConfiguration: RoomConfigurationSchema,
  childCount: z.number().int().min(0),
  travelers: z
    .array(TravelerInputSchema)
    .min(1, { error: "At least one traveler is required." }),
  contactName: z.string().min(1, { error: "Name is required." }),
  contactEmail: z.email({ error: "Enter a valid email." }),
  contactPhone: z.string().optional(),
  contactPreference: z.enum(["callback", "pay_online"], {
    error: "Choose how you'd like to complete payment.",
  }),
});

export type BookingInput = z.infer<typeof BookingInputSchema>;

/**
 * Public-flow-only extension: the amount the customer chose (or was forced
 * into, for a guaranteed departure) via the payment slider in BookingForm.
 * Re-validated server-side against the departure's bookingAssurance and
 * price range in createBookingCore — this schema only guards "it's a
 * positive number", not the actual floor/ceiling (those need the tour's
 * pricing, which isn't available until the server action loads it).
 */
export const PublicBookingInputSchema = BookingInputSchema.extend({
  paymentAmount: z.number().positive({ error: "Choose a payment amount." }),
});
export type PublicBookingInput = z.infer<typeof PublicBookingInputSchema>;

/**
 * Same shape as BookingInputSchema plus an admin-chosen initial status —
 * used by createManualBooking (e.g. a phone registration) where there's no
 * Stripe leg to determine status, so staff set it directly.
 */
export const ManualBookingInputSchema = BookingInputSchema.extend({
  status: z.enum(["pending_payment", "partial_paid", "paid_in_full"], {
    error: "Choose a status.",
  }),
});
export type ManualBookingInput = z.infer<typeof ManualBookingInputSchema>;
