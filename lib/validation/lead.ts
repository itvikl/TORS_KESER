import * as z from "zod";

/** Converts an empty-string form field to undefined before the rest of the schema runs. */
function optionalText() {
  return z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().optional());
}

/** A date input's YYYY-MM-DD value; a blank field becomes undefined. */
function optionalDate() {
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.iso.date({ error: "Enter a valid date." }).optional()
  );
}

/** YYYY-MM-DD strings sort chronologically, so a plain comparison is enough. */
function travelDatesInOrder(data: { travelStartDate?: string; travelEndDate?: string }) {
  return !data.travelStartDate || !data.travelEndDate || data.travelEndDate >= data.travelStartDate;
}
const TRAVEL_DATES_ORDER_ERROR = {
  error: "The end date can't be before the start date.",
  path: ["travelEndDate"],
};

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
  travelStartDate: optionalDate(),
  travelEndDate: optionalDate(),
  phone: z.string().min(1, { error: "Phone is required." }),
}).refine(travelDatesInOrder, TRAVEL_DATES_ORDER_ERROR);
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
  travelStartDate: optionalDate(),
  travelEndDate: optionalDate(),
  tourId: optionalText(),
  status: z.enum(["new", "contacted", "converted", "closed"]),
  notes: optionalText(),
}).refine(travelDatesInOrder, TRAVEL_DATES_ORDER_ERROR);
export type ManualLeadInput = z.infer<typeof ManualLeadInputSchema>;
