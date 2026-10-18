import type { Lead } from "@/lib/types";

/** Shared by the admin leads table, the lead edit page and the Excel export. */
export const LEAD_SOURCE_LABELS: Record<Lead["source"], string> = {
  contact: "Contact form",
  custom: "Custom tour",
  evergreen: "Evergreen",
  manual: "Manual",
};

export const LEAD_STATUS_LABELS: Record<Lead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  closed: "Closed",
};
