import * as z from "zod";

/** Mirrors lib/types.ts SpecialOffer, minus offerId (assigned by the data layer). */
export const OfferInputSchema = z.object({
  title: z.string().min(1, { error: "Title is required." }),
  body: z.string().min(1, { error: "Body is required." }),
  image: z.string().optional(),
  tourId: z.string().optional(),
  validUntil: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

export type OfferInput = z.infer<typeof OfferInputSchema>;
