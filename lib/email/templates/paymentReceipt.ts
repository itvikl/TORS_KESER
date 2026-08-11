import { formatUsd } from "@/lib/pricing";
import { escapeHtml, formatDateRange, summaryRow, summaryTable, wrapEmail } from "@/lib/email/layout";
import type { EmailContent } from "@/lib/email/templates/bookingConfirmation";

export interface PaymentReceiptData {
  bookingId: string;
  contactName: string;
  tourTitle: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  totalPaid: number;
  grandTotal: number;
  balanceRemaining: number;
  paymentRef?: string;
  paidInFull: boolean;
}

export function paymentReceiptEmail(data: PaymentReceiptData): EmailContent {
  const dates = formatDateRange(data.startDate, data.endDate);
  const heading = data.paidInFull ? "Payment received — paid in full" : "Payment received";
  const statusLine = data.paidInFull
    ? "Your trip is paid in full — no balance remaining."
    : `Remaining balance of ${formatUsd(data.balanceRemaining)} is due before departure.`;

  const rows =
    summaryRow("Booking reference", data.bookingId) +
    summaryRow("Amount charged", formatUsd(data.amountPaid)) +
    (data.paymentRef ? summaryRow("Payment reference", data.paymentRef) : "") +
    summaryRow("Total paid to date", formatUsd(data.totalPaid)) +
    summaryRow("Trip total", formatUsd(data.grandTotal)) +
    summaryRow("Balance remaining", formatUsd(data.balanceRemaining));

  const html = wrapEmail(
    `Receipt for your payment on ${data.tourTitle}.`,
    `<h1 style="margin:0 0 16px;font-size:20px;color:#1b3a5c;">${heading}</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(data.contactName)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Thanks — we've charged your card ${formatUsd(data.amountPaid)} for <strong>${escapeHtml(data.tourTitle)}</strong> (${dates}). This email is your receipt.
    </p>
    ${summaryTable(rows)}
    <p style="margin:0;font-size:15px;line-height:1.6;">${statusLine}</p>`
  );

  const text = `Hi ${data.contactName},

Thanks — we've charged your card ${formatUsd(data.amountPaid)} for ${data.tourTitle} (${dates}). This email is your receipt.

Booking reference: ${data.bookingId}
Amount charged: ${formatUsd(data.amountPaid)}${data.paymentRef ? `\nPayment reference: ${data.paymentRef}` : ""}
Total paid to date: ${formatUsd(data.totalPaid)}
Trip total: ${formatUsd(data.grandTotal)}
Balance remaining: ${formatUsd(data.balanceRemaining)}

${statusLine}`;

  return { subject: `Payment receipt — ${data.tourTitle}`, html, text };
}
