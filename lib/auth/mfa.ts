/**
 * Admin two-factor (TOTP authenticator app) enforcement, shared by
 * app/api/auth/session, proxy.ts and lib/auth/dal.ts. Kept dependency-free
 * like ./constants so proxy.ts can import it.
 *
 * Off unless ADMIN_REQUIRE_2FA=true, so deploying the code can't lock anyone
 * out before TOTP is enabled on the Firebase project
 * (scripts/enable-admin-2fa.ts). Once on, an admin session is only valid if
 * it came from a sign-in that passed a second factor — Firebase stamps that
 * into the ID token as `firebase.sign_in_second_factor`, and the session
 * cookie inherits it.
 */
export function isAdmin2faRequired(): boolean {
  return process.env.ADMIN_REQUIRE_2FA === "true";
}

export function hasSecondFactor(decoded: { firebase?: { sign_in_second_factor?: string } }): boolean {
  return Boolean(decoded.firebase?.sign_in_second_factor);
}

export function passesAdmin2fa(decoded: { firebase?: { sign_in_second_factor?: string } }): boolean {
  return !isAdmin2faRequired() || hasSecondFactor(decoded);
}

/** Returned by POST /api/auth/session when the account must set up 2FA first. */
export const MFA_ENROLLMENT_REQUIRED = "mfa_enrollment_required";
