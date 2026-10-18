import * as z from "zod";

/** Mirrors lib/types.ts Staff, minus staffId (assigned by the data layer). */
export const StaffInputSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }),
  role: z.enum(["guide", "kashrutSupervisor"]),
  bio: z.string().optional(),
  photo: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
});

export type StaffInput = z.infer<typeof StaffInputSchema>;
