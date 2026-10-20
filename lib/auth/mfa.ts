/**
 * Admin two-factor settings and wire constants, shared by the server
 * (lib/auth/secondFactor.ts, app/api/auth/session) and the sign-in form
 * (components/admin/LoginForm). Dependency-free so the client can import it.
 *
 * Off unless ADMIN_REQUIRE_2FA=true. Once on, every admin session needs a
 * second factor: an authenticator app if the account has one enrolled,
 * otherwise a code emailed to the account's address (lib/auth/emailMfa.ts).
 * Emailed codes need a sender that can reach every admin's inbox — i.e. a
 * domain verified in Resend, not the onboarding@resend.dev test sender.
 */
export function isAdmin2faRequired(): boolean {
  return process.env.ADMIN_REQUIRE_2FA === "true";
}

export function hasSecondFactor(decoded: { firebase?: { sign_in_second_factor?: string } }): boolean {
  return Boolean(decoded.firebase?.sign_in_second_factor);
}

/** POST /api/auth/session answers (403) — a code was emailed; resubmit with `emailCode`. */
export const EMAIL_CODE_SENT = "email_code_sent";
/** POST /api/auth/session answers (401) — the emailed code was wrong or expired. */
export const EMAIL_CODE_INVALID = "email_code_invalid";
/** POST /api/auth/session answers (502) — the code email couldn't be sent. */
export const EMAIL_CODE_UNDELIVERABLE = "email_code_undeliverable";
