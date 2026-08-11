import { formatUsd } from "@/lib/pricing";
import { escapeHtml, formatDateRange, summaryRow, summaryTable, wrapEmail } from "@/lib/email/layout";
import type { ContactPreference } from "@/lib/types";

export interface BookingConfirmationData {
  bookingId: string;
  contactName: string;
  tourTitle: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  grandTotal: number;
  depositAmount: number;
  balanceAmount: number;
  contactPreference: ContactPreference;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function bookingConfirmationEmail(data: BookingConfirmationData): EmailContent {
  const dates = formatDateRange(data.startDate, data.endDate);
  const travelerLabel = `${data.travelerCount} traveler${data.travelerCount === 1 ? "" : "s"}`;

  const nextStep =
    data.contactPreference === "pay_online"
      ? `Complete your deposit of ${formatUsd(data.depositAmount)} online to secure your spot.`
      : `Our team will call you shortly to collect your deposit of ${formatUsd(data.depositAmount)} and confirm your spot.`;

  const rows =
    summaryRow("Booking reference", data.bookingId) +
    summaryRow("Trip total", formatUsd(data.grandTotal)) +
    summaryRow("Deposit due", formatUsd(data.depositAmount)) +
    summaryRow("Balance due", formatUsd(data.balanceAmount));

  const html = wrapEmail(
    `Your booking for ${data.tourTitle} is received.`,
    `<h1 style="margin:0 0 16px;font-size:20px;color:#1b3a5c;">Booking received</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(data.contactName)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      We've received your registration for <strong>${escapeHtml(data.tourTitle)}</strong> (${dates}).
      This confirms your spot is on hold for ${travelerLabel} — it isn't paid yet.
    </p>
    ${summaryTable(rows)}
    <p style="margin:0;font-size:15px;line-height:1.6;">${nextStep}</p>`
  );

  const text = `Hi ${data.contactName},

We've received your registration for ${data.tourTitle} (${dates}). This confirms your spot is on hold for ${travelerLabel} — it isn't paid yet.

Booking reference: ${data.bookingId}
Trip total: ${formatUsd(data.grandTotal)}
Deposit due: ${formatUsd(data.depositAmount)}
Balance due: ${formatUsd(data.balanceAmount)}

${nextStep}`;

  return { subject: `Booking received — ${data.tourTitle}`, html, text };
}
