import { escapeHtml, wrapEmail } from "@/lib/email/layout";
import type { EmailContent } from "@/lib/email/templates/bookingConfirmation";

/** "Forgot password?" on the admin sign-in page (lib/actions/adminAccount.ts). */
export function adminPasswordResetEmail(resetLink: string): EmailContent {
  const subject = "Reset your Keshertours admin password";
  const href = escapeHtml(resetLink);
  const body = `
    <p style="margin:0 0 16px;font-size:16px;">Someone asked to reset the password for your Keshertours admin account.</p>
    <p style="margin:0 0 24px;">
      <a href="${href}" style="display:inline-block;background:#1b3a5c;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:6px;">Choose a new password</a>
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:#5a5245;">The link expires in 1 hour and works once. Two-factor sign-in still applies after you change it.</p>
    <p style="margin:0;font-size:14px;color:#5a5245;">If you didn't ask for this, ignore this email — your password stays the same.</p>`;
  const text = `Someone asked to reset the password for your Keshertours admin account.\n\nChoose a new password: ${resetLink}\n\nThe link expires in 1 hour and works once. Two-factor sign-in still applies after you change it.\nIf you didn't ask for this, ignore this email — your password stays the same.`;
  return { subject, html: wrapEmail("Reset your admin password", body), text };
}
