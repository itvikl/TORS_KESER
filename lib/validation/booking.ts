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
