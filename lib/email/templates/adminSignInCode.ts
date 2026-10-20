import { escapeHtml, wrapEmail } from "@/lib/email/layout";
import type { EmailContent } from "@/lib/email/templates/bookingConfirmation";

/** The admin email second factor (lib/auth/emailMfa.ts). */
export function adminSignInCodeEmail(code: string, minutesValid: number): EmailContent {
  const subject = `${code} is your Keshertours admin sign-in code`;
  const body = `
    <p style="margin:0 0 16px;font-size:16px;">Your admin sign-in code:</p>
    <p style="margin:0 0 24px;font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:0.3em;color:#1b3a5c;">${escapeHtml(code)}</p>
    <p style="margin:0 0 12px;font-size:14px;color:#5a5245;">It expires in ${minutesValid} minutes and works once.</p>
    <p style="margin:0;font-size:14px;color:#5a5245;">If you didn't just try to sign in, someone has your password — change it and tell another admin.</p>`;
  const text = `Your Keshertours admin sign-in code: ${code}\n\nIt expires in ${minutesValid} minutes and works once.\nIf you didn't just try to sign in, someone has your password — change it and tell another admin.`;
  return { subject, html: wrapEmail(`Your sign-in code is ${code}`, body), text };
}
