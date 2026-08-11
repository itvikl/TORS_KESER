import "server-only";
import { Resend } from "resend";

/**
 * Resend SDK — server-only. Free tier for now (PRD email confirmations);
 * swap RESEND_API_KEY/EMAIL_FROM for a verified-domain provider before launch.
 */
let resendSingleton: Resend | null = null;

export function resendClient(): Resend {
  if (resendSingleton) return resendSingleton;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  resendSingleton = new Resend(apiKey);
  return resendSingleton;
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Keshertours <onboarding@resend.dev>";
}
