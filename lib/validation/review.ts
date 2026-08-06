import * as z from "zod";

/** Mirrors lib/types.ts Review, minus reviewId (assigned by the data layer). */
export const ReviewInputSchema = z.object({
  tourId: z.string().min(1, { error: "Choose a tour." }),
  customerName: z.string().min(1, { error: "Customer name is required." }),
  rating: z.number().int().min(1, { error: "Rating is required." }).max(5),
  photo: z.string().optional(),
  body: z.string().min(1, { error: "Review text is required." }),
  status: z.enum(["pending", "approved", "rejected"]),
});

export type ReviewInput = z.infer<typeof ReviewInputSchema>;
