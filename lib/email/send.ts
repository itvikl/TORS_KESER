import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { emailFrom, resendClient } from "@/lib/email/resend";
import { bookingConfirmationEmail } from "@/lib/email/templates/bookingConfirmation";
import { bookingNotificationEmail, leadNotificationEmail } from "@/lib/email/templates/adminNotifications";
import { paymentReceiptEmail } from "@/lib/email/templates/paymentReceipt";
import { SITE_URL } from "@/lib/siteUrl";
import type { Booking, Departure, Lead, Tour } from "@/lib/types";

async function getTourAndDeparture(
  tourId: string,
  departureId: string
): Promise<{ tour: Tour | null; departure: Departure | null }> {
  const [tourSnap, departureSnap] = await Promise.all([
    adminDb().collection("tours").doc(tourId).get(),
    adminDb().collection("departures").doc(departureId).get(),
  ]);

  return {
    tour: tourSnap.exists ? (tourSnap.data() as Tour) : null,
    departure: departureSnap.exists ? (departureSnap.data() as Departure) : null,
  };
}

/**
 * Sends the "we got your registration" email right after a booking is
 * created (public or admin flow) — separate from the payment receipt below,
 * since most bookings start `pending_payment` with no charge yet.
 *
 * Best-effort: a failed send must never fail the booking flow it's attached
 * to, so errors are logged and swallowed here rather than thrown.
 */
export async function sendBookingConfirmationEmail(booking: Booking): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `Skipping booking confirmation email for ${booking.bookingId}: RESEND_API_KEY not configured.`
    );
    return;
  }

  try {
    const { tour, departure } = await getTourAndDeparture(booking.tourId, booking.departureId);
    if (!tour || !departure) {
      console.error(
        `Booking confirmation email for ${booking.bookingId}: tour or departure not found.`
      );
      return;
    }

    const { subject, html, text } = bookingConfirmationEmail({
      bookingId: booking.bookingId,
      contactName: booking.contactName,
      tourTitle: tour.title,
      startDate: departure.startDate,
      endDate: departure.endDate,
      travelerCount: booking.travelerCount,
      grandTotal: booking.priceBreakdown.grandTotal,
      depositAmount: booking.depositAmount,
      balanceAmount: booking.balanceAmount,
      contactPreference: booking.contactPreference,
    });

    await resendClient().emails.send({
      from: emailFrom(),
      to: booking.contactEmail,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error(`Failed to send booking confirmation email for ${booking.bookingId}:`, err);
  }
}

export interface PaymentReceiptInput {
  /** Booking snapshot AFTER this payment has been applied (status/amountPaid already updated). */
  booking: Booking;
  /** This specific payment's amount — may differ from booking.amountPaid, which is the running total. */
  amount: number;
  providerRef?: string;
}

/** Sends a payment receipt — call only once a payment has actually been recorded (e.g. from the Stripe webhook). */
export async function sendPaymentReceiptEmail(input: PaymentReceiptInput): Promise<void> {
  const { booking } = input;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `Skipping payment receipt email for ${booking.bookingId}: RESEND_API_KEY not configured.`
    );
    return;
  }

  try {
    const { tour, departure } = await getTourAndDeparture(booking.tourId, booking.departureId);
    if (!tour || !departure) {
      console.error(`Payment receipt email for ${booking.bookingId}: tour or departure not found.`);
      return;
    }

    const { subject, html, text } = paymentReceiptEmail({
      bookingId: booking.bookingId,
      contactName: booking.contactName,
      tourTitle: tour.title,
      startDate: departure.startDate,
      endDate: departure.endDate,
      amountPaid: input.amount,
      totalPaid: booking.amountPaid,
      grandTotal: booking.priceBreakdown.grandTotal,
      balanceRemaining: Math.max(0, booking.priceBreakdown.grandTotal - booking.amountPaid),
      paymentRef: input.providerRef,
      paidInFull: booking.status === "paid_in_full",
    });

    await resendClient().emails.send({
      from: emailFrom(),
      to: booking.contactEmail,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error(`Failed to send payment receipt email for ${booking.bookingId}:`, err);
  }
}

/**
 * Staff inbox(es) for new-booking / new-lead alerts — ADMIN_NOTIFY_EMAIL,
 * comma-separated. Until a sending domain is verified in Resend, only the
 * Resend account owner's address will actually receive mail.
 */
function adminNotifyRecipients(): string[] {
  return (process.env.ADMIN_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

/** Alerts staff that a customer booked online. Best-effort, like the customer emails above. */
export async function sendBookingNotificationEmail(
  booking: Booking,
  travelerNames: string[]
): Promise<void> {
  const to = adminNotifyRecipients();
  if (!process.env.RESEND_API_KEY || to.length === 0) {
    console.warn(
      `Skipping booking notification for ${booking.bookingId}: RESEND_API_KEY or ADMIN_NOTIFY_EMAIL not configured.`
    );
    return;
  }

  try {
    const { tour, departure } = await getTourAndDeparture(booking.tourId, booking.departureId);
    if (!tour || !departure) {
      console.error(`Booking notification for ${booking.bookingId}: tour or departure not found.`);
      return;
    }

    const { subject, html, text } = bookingNotificationEmail({
      bookingId: booking.bookingId,
      tourTitle: tour.title,
      startDate: departure.startDate,
      endDate: departure.endDate,
      contactName: booking.contactName,
      contactEmail: booking.contactEmail,
      contactPhone: booking.contactPhone,
      contactPreference: booking.contactPreference,
      travelerNames,
      roomConfiguration: booking.roomConfiguration,
      grandTotal: booking.priceBreakdown.grandTotal,
      depositAmount: booking.depositAmount,
      initialPaymentAmount: booking.initialPaymentAmount,
      adminUrl: `${SITE_URL}/admin/bookings/${booking.tourId}/${booking.departureId}`,
    });

    await resendClient().emails.send({
      from: emailFrom(),
      to,
      replyTo: booking.contactEmail,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error(`Failed to send booking notification for ${booking.bookingId}:`, err);
  }
}

/** Alerts staff that a lead came in from a public form. Best-effort. */
export async function sendLeadNotificationEmail(lead: Lead): Promise<void> {
  const to = adminNotifyRecipients();
  if (!process.env.RESEND_API_KEY || to.length === 0) {
    console.warn(
      `Skipping lead notification for ${lead.leadId}: RESEND_API_KEY or ADMIN_NOTIFY_EMAIL not configured.`
    );
    return;
  }

  try {
    let tourTitle: string | undefined;
    if (lead.tourId) {
      const tourSnap = await adminDb().collection("tours").doc(lead.tourId).get();
      tourTitle = tourSnap.exists ? (tourSnap.data() as Tour).title : undefined;
    }

    const { subject, html, text } = leadNotificationEmail({
      leadId: lead.leadId,
      source: lead.source,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      destination: lead.destination,
      groupSize: lead.groupSize,
      tourTitle,
      message: lead.message,
      adminUrl: `${SITE_URL}/admin/leads/${lead.leadId}`,
    });

    await resendClient().emails.send({
      from: emailFrom(),
      to,
      ...(lead.email ? { replyTo: lead.email } : {}),
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error(`Failed to send lead notification for ${lead.leadId}:`, err);
  }
}
