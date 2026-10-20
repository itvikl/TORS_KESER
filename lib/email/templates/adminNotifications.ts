import { formatUsd } from "@/lib/pricing";
import { escapeHtml, formatDateRange, summaryRow, summaryTable, wrapEmail } from "@/lib/email/layout";
import { LEAD_SOURCE_LABELS } from "@/lib/leadLabels";
import type { EmailContent } from "@/lib/email/templates/bookingConfirmation";
import type { ContactPreference, LeadSource, RoomConfiguration } from "@/lib/types";

export interface BookingNotificationData {
  bookingId: string;
  tourTitle: string;
  startDate: string;
  endDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactPreference: ContactPreference;
  travelerNames: string[];
  roomConfiguration: RoomConfiguration;
  grandTotal: number;
  depositAmount: number;
  initialPaymentAmount: number;
  adminUrl: string;
}

const CONTACT_PREFERENCE_LABELS: Record<ContactPreference, string> = {
  callback: "Call me back",
  pay_online: "Pay online",
};

function roomsLabel(rooms: RoomConfiguration): string {
  const parts = [
    rooms.doubleRooms && `${rooms.doubleRooms} double`,
    rooms.singleRooms && `${rooms.singleRooms} single`,
    rooms.triples && `${rooms.triples} triple`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function adminLink(url: string, label: string): string {
  return `<p style="margin:0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#1b3a5c;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px;">${escapeHtml(label)}</a></p>`;
}

/** Staff-facing "a new booking just came in" alert — not sent to the customer. */
export function bookingNotificationEmail(data: BookingNotificationData): EmailContent {
  const dates = formatDateRange(data.startDate, data.endDate);
  const travelers = data.travelerNames.join(", ");

  const fields: [string, string][] = [
    ["Tour", data.tourTitle],
    ["Dates", dates],
    ["Name", data.contactName],
    ["Email", data.contactEmail],
    ["Phone", data.contactPhone || "—"],
    ["Next step", CONTACT_PREFERENCE_LABELS[data.contactPreference]],
    [`Travelers (${data.travelerNames.length})`, travelers],
    ["Rooms", roomsLabel(data.roomConfiguration)],
    ["Trip total", formatUsd(data.grandTotal)],
    ["Deposit (minimum)", formatUsd(data.depositAmount)],
    ["Chosen first payment", formatUsd(data.initialPaymentAmount)],
    ["Booking reference", data.bookingId],
  ];

  const html = wrapEmail(
    `${data.contactName} booked ${data.tourTitle}.`,
    `<h1 style="margin:0 0 16px;font-size:20px;color:#1b3a5c;">New booking</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      <strong>${escapeHtml(data.contactName)}</strong> registered for <strong>${escapeHtml(data.tourTitle)}</strong> (${dates}).
    </p>
    ${summaryTable(fields.map(([label, value]) => summaryRow(label, value)).join(""))}
    ${adminLink(data.adminUrl, "Open in admin")}`
  );

  const text = `New booking

${fields.map(([label, value]) => `${label}: ${value}`).join("\n")}

Open in admin: ${data.adminUrl}`;

  return {
    subject: `New booking — ${data.tourTitle} (${data.travelerNames.length} traveler${data.travelerNames.length === 1 ? "" : "s"})`,
    html,
    text,
  };
}

export interface LeadNotificationData {
  leadId: string;
  source: LeadSource;
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  destination?: string;
  groupSize?: number;
  tourTitle?: string;
  message?: string;
  adminUrl: string;
}

/** Staff-facing "a new lead just came in" alert. */
export function leadNotificationEmail(data: LeadNotificationData): EmailContent {
  const sourceLabel = LEAD_SOURCE_LABELS[data.source];
  const who = data.name || data.email || data.phone || "Someone";

  const fields: [string, string | undefined][] = [
    ["Source", sourceLabel],
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Country", data.country],
    ["Tour", data.tourTitle],
    ["Destination", data.destination],
    ["Group size", data.groupSize !== undefined ? String(data.groupSize) : undefined],
  ];
  const shown = fields.filter((f): f is [string, string] => Boolean(f[1]));

  const messageHtml = data.message
    ? `<p style="margin:0 0 6px;font-size:14px;color:#5a5245;">Message</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.message)}</p>`
    : "";

  const html = wrapEmail(
    `New lead from ${who}.`,
    `<h1 style="margin:0 0 16px;font-size:20px;color:#1b3a5c;">New lead — ${escapeHtml(sourceLabel)}</h1>
    ${summaryTable(shown.map(([label, value]) => summaryRow(label, value)).join(""))}
    ${messageHtml}
    ${adminLink(data.adminUrl, "Open in admin")}`
  );

  const text = `New lead — ${sourceLabel}

${shown.map(([label, value]) => `${label}: ${value}`).join("\n")}${data.message ? `\n\nMessage:\n${data.message}` : ""}

Open in admin: ${data.adminUrl}`;

  return { subject: `New lead — ${who} (${sourceLabel})`, html, text };
}
