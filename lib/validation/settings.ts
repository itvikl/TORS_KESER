import * as z from "zod";

function optionalText() {
  return z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().optional());
}

/** Mirrors lib/types.ts SiteSettings. Bound to a native <form>, so numeric fields arrive as strings. */
export const SiteSettingsInputSchema = z.object({
  phone: z.string().min(1, { error: "Phone is required." }),
  phoneAlt: optionalText(),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.email({ error: "Enter a valid email." }).optional()
  ),
  defaultDepositAmount: z.coerce.number().min(0),
  defaultMinGroupSize: z.coerce.number().int().min(0),
  defaultBalanceDueDays: z.coerce.number().int().min(0),
  defaultCompanyCancelDeadlineDays: z.coerce.number().int().min(0),
  lowSeatsThreshold: z.coerce.number().int().min(1),
});

export type SiteSettingsInput = z.infer<typeof SiteSettingsInputSchema>;
