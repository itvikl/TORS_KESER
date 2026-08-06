import * as z from "zod";

/** Converts an empty-string form field to undefined before the rest of the schema runs. */
function optionalText() {
  return z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().optional());
}

export const ContactLeadInputSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }),
  email: z.email({ error: "Enter a valid email." }),
  phone: optionalText(),
  country: optionalText(),
  message: optionalText(),
});
export type ContactLeadInput = z.infer<typeof ContactLeadInputSchema>;

export const CustomTourLeadInputSchema = z.object({
  destination: optionalText(),
  groupSize: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number().int().positive().optional()
  ),
  phone: z.string().min(1, { error: "Phone is required." }),
});
export type CustomTourLeadInput = z.infer<typeof CustomTourLeadInputSchema>;

/** One general "add lead" form for admin staff (e.g. a phone inquiry), covering both intake shapes above plus staff-only fields. */
export const ManualLeadInputSchema = z.object({
  name: optionalText(),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.email({ error: "Enter a valid email." }).optional()
  ),
  phone: optionalText(),
  country: optionalText(),
  message: optionalText(),
  destination: optionalText(),
  groupSize: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number().int().positive().optional()
  ),
  tourId: optionalText(),
  status: z.enum(["new", "contacted", "converted", "closed"]),
});
export type ManualLeadInput = z.infer<typeof ManualLeadInputSchema>;
