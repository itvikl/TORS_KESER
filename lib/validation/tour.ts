import * as z from "zod";
import { COUNTRIES } from "@/lib/countries";

const KashrutBooleanOrNotGuaranteed = z.union([z.boolean(), z.literal("not_guaranteed")]);

export const ItineraryDayInputSchema = z.object({
  dayId: z.string().min(1),
  dayNumber: z.number().int().min(1),
  title: z.string().min(1, { error: "Day title is required." }),
  description: z.string(),
  meals: z.array(z.string()),
  accommodation: z.string().optional(),
  attractions: z.array(z.string()).optional(),
});

const TourInfoFieldSchema = z.object({
  fieldId: z.string().min(1),
  label: z.string(),
  value: z.string(),
});

export const TourInfoCardSchema = z.object({
  cardId: z.string().min(1),
  title: z.string().min(1, { error: "Card title is required." }),
  fields: z.array(TourInfoFieldSchema),
  notes: z.string().optional(),
  items: z.array(z.string()),
});

/**
 * Mirrors lib/types.ts Tour, minus tourId/slugHistory (both are assigned by
 * the data layer, not editable in the form — see lib/data/admin/tours.ts).
 */
export const TourInputSchema = z.object({
  slug: z
    .string()
    .min(1, { error: "Slug is required." })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: "Slug must be lowercase, hyphen-separated (e.g. kosher-tour-to-italy).",
    }),
  title: z.string().min(1, { error: "Title is required." }),
  summary: z.string().min(1, { error: "Summary is required." }),
  description: z.string(),
  heroImage: z.string(),
  gallery: z.array(z.string()),
  countries: z
    .array(z.enum(COUNTRIES))
    .min(1, { error: "Choose at least one country." }),
  travelStyle: z.enum(["land", "luxury", "cruise", "seminar"]),
  themeTags: z.array(z.string()),
  durationDays: z.number().int().min(1, { error: "Duration must be at least 1 day." }),
  minGroupSize: z.number().int().min(0),
  flightsIncluded: z.boolean(),
  isSpecialOffer: z.boolean().optional(),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
  importantToKnow: z.array(z.string()).optional(),
  infoCards: z.array(TourInfoCardSchema).optional(),
  pricing: z.object({
    pricePerPersonDouble: z.number().min(0),
    pricePerPersonSingle: z.number().min(0),
    pricePerPersonTriple: z.number().min(0).optional(),
    childPrice: z.number().min(0).optional(),
    depositAmountPerPerson: z.number().min(0),
    balanceDueDaysBeforeDeparture: z.number().int().min(0),
  }),
  kashrutDetails: z.object({
    title: z.string().optional(),
    supervisionLevel: z.string().min(1, { error: "Supervision level is required." }),
    patYisrael: KashrutBooleanOrNotGuaranteed,
    chalavYisrael: KashrutBooleanOrNotGuaranteed,
    extraFields: z.array(TourInfoFieldSchema).optional(),
    notes: z.string().optional(),
  }),
  itineraryDays: z.array(ItineraryDayInputSchema),
  status: z.enum(["draft", "published", "archived"]),
  cancellationPolicy: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type TourInput = z.infer<typeof TourInputSchema>;
