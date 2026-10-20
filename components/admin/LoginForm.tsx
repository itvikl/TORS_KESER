"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  getMultiFactorResolver,
  multiFactor,
  signInWithEmailAndPassword,
  signOut,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type MultiFactorResolver,
  type TotpSecret,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { EMAIL_CODE_INVALID, EMAIL_CODE_SENT, EMAIL_CODE_UNDELIVERABLE } from "@/lib/auth/mfa";

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-navy";
const buttonClass =
  "w-full rounded-lg bg-navy px-4 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60";

/**
 * Sign-in steps: password → second factor. Accounts with an authenticator app
 * get Firebase's multi-factor-auth-required error after the password and
 * enter its code ("code"). When the server requires 2FA (ADMIN_REQUIRE_2FA)
 * and the account has no app, /api/auth/session emails a code instead
 * ("email"); from there the account can also switch to setting up an
 * authenticator app ("enroll"), then signs in again with its first code.
 */
type Step =
  | { kind: "password" }
  | { kind: "code"; resolver: MultiFactorResolver }
  | { kind: "email"; user: User; sentTo: string }
  | { kind: "enroll"; user: User; secret: TotpSecret; qrDataUrl: string };

async function createSession(user: User, emailCode?: string): Promise<Response> {
  const idToken = await user.getIdToken();
  return fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, emailCode }),
  });
}

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "password" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Throws on anything but success or a pending emailed code, after signing the Firebase user out. */
  async function finishSignIn(user: User, emailCode?: string) {
    const response = await createSession(user, emailCode);
    if (response.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }
    const body = await response.json().catch(() => null);
    if (body?.error === EMAIL_CODE_SENT) {
      setCode("");
      setStep({ kind: "email", user, sentTo: body.sentTo });
      setSubmitting(false);
      return;
    }
    if (body?.error === EMAIL_CODE_INVALID) {
      throw new Error(EMAIL_CODE_INVALID);
    }
    await signOut(auth);
    throw new Error(body?.error === EMAIL_CODE_UNDELIVERABLE ? EMAIL_CODE_UNDELIVERABLE : "not-authorized");
  }

  async function startEnrollment(user: User) {
    setError(null);
    setSubmitting(true);
    try {
      const session = await multiFactor(user).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(session);
      const qrDataUrl = await QRCode.toDataURL(
        secret.generateQrCodeUrl(user.email ?? email, "Keshertours Admin"),
        { margin: 1, width: 200 }
      );
      setCode("");
      setStep({ kind: "enroll", user, secret, qrDataUrl });
    } catch {
      setError("Couldn't start authenticator setup. Sign in again and retry.");
    }
    setSubmitting(false);
  }

  async function handleEmailCode(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== "email") return;
    setError(null);
    setSubmitting(true);
    try {
      await finishSignIn(step.user, code.trim());
    } catch (err) {
      if ((err as Error).message === EMAIL_CODE_INVALID) {
        setError("That code is wrong or expired. Check the email, or send a new code.");
      } else {
        setStep({ kind: "password" });
        setError("Sign-in expired. Sign in again.");
      }
      setSubmitting(false);
    }
  }

  async function resendEmailCode() {
    if (step.kind !== "email") return;
    setError(null);
    setSubmitting(true);
    try {
      await finishSignIn(step.user);
      setNotice(null);
    } catch {
      setStep({ kind: "password" });
      setError("Couldn't send a new code. Sign in again.");
      setSubmitting(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await finishSignIn(credential.user);
    } catch (err) {
      if ((err as { code?: string }).code === "auth/multi-factor-auth-required") {
        setCode("");
        setStep({ kind: "code", resolver: getMultiFactorResolver(auth, err as MultiFactorError) });
        setSubmitting(false);
        return;
      }
      setError(
        (err as Error).message === EMAIL_CODE_UNDELIVERABLE
          ? "Couldn't email your sign-in code. Try again in a minute, or ask an admin."
          : "Invalid email/password, or this account isn't authorized for admin access."
      );
      setSubmitting(false);
    }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== "code") return;
    setError(null);
    setSubmitting(true);

    const hint = step.resolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    if (!hint) {
      setError("This account's second factor isn't an authenticator app. Ask an admin to reset it.");
      setSubmitting(false);
      return;
    }
    try {
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim());
      const credential = await step.resolver.resolveSignIn(assertion);
      await finishSignIn(credential.user);
    } catch {
      setError("That code didn't work. Check your authenticator app and try again.");
      setSubmitting(false);
    }
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== "enroll") return;
    setError(null);
    setSubmitting(true);

    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(step.secret, code.trim());
      await multiFactor(step.user).enroll(assertion, "Authenticator app");
    } catch (err) {
      const errCode = (err as { code?: string }).code;
      setError(
        errCode === "auth/unverified-email"
          ? "This account's email isn't verified, so 2FA can't be set up. Ask an admin to fix the account."
          : "That code didn't work. Check your authenticator app and try again."
      );
      setSubmitting(false);
      return;
    }
    // The current sign-in predates the second factor, so it can't open a
    // 2FA-required session — sign in again, this time with a code.
    await signOut(auth);
    setPassword("");
    setCode("");
    setStep({ kind: "password" });
    setNotice("Two-factor authentication is set up. Sign in again and enter a code from your app.");
    setSubmitting(false);
  }

  function backToPassword() {
    void signOut(auth);
    setStep({ kind: "password" });
    setError(null);
  }

  const errorBlock = error && (
    <p role="alert" className="text-sm font-medium text-terracotta-dark">
      {error}
    </p>
  );

  const codeInput = (
    <div>
      <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-ink">
        6-digit code
      </label>
      <input
        id="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        className={`${inputClass} text-center font-mono tracking-[0.4em]`}
      />
    </div>
  );

  if (step.kind === "code") {
    return (
      <form onSubmit={handleCode} className="space-y-5">
        <p className="text-sm text-ink-muted">
          Enter the code from your authenticator app for <strong className="text-ink">{email}</strong>.
        </p>
        {codeInput}
        {errorBlock}
        <button type="submit" disabled={submitting || code.length !== 6} className={buttonClass}>
          {submitting ? "Verifying…" : "Verify"}
        </button>
        <button type="button" onClick={backToPassword} className="w-full text-sm text-ink-muted hover:text-ink">
          Back
        </button>
      </form>
    );
  }

  if (step.kind === "email") {
    return (
      <form onSubmit={handleEmailCode} className="space-y-5">
        <p className="text-sm text-ink-muted">
          We emailed a 6-digit sign-in code to <strong className="text-ink">{step.sentTo}</strong>. It expires in 10
          minutes.
        </p>
        {codeInput}
        {errorBlock}
        <button type="submit" disabled={submitting || code.length !== 6} className={buttonClass}>
          {submitting ? "Verifying…" : "Verify"}
        </button>
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <button type="button" disabled={submitting} onClick={resendEmailCode} className="text-ink-muted hover:text-ink">
            Send a new code
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => startEnrollment(step.user)}
            className="text-ink-muted hover:text-ink"
          >
            Use an authenticator app instead
          </button>
        </div>
        <button type="button" onClick={backToPassword} className="w-full text-sm text-ink-muted hover:text-ink">
          Back
        </button>
      </form>
    );
  }

  if (step.kind === "enroll") {
    return (
      <form onSubmit={handleEnroll} className="space-y-5">
        <div className="space-y-2 text-sm text-ink-muted">
          <p className="font-semibold text-ink">Set up two-factor authentication</p>
          <p>
            Admin access requires an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…).
            Scan this code with the app, then enter the 6-digit code it shows.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- a local data: URL, nothing for next/image to optimize */}
        <img src={step.qrDataUrl} alt="Authenticator setup QR code" width={200} height={200} className="mx-auto" />
        <details className="text-xs text-ink-muted">
          <summary className="cursor-pointer">Can&apos;t scan? Enter this key instead</summary>
          <code className="mt-2 block break-all rounded bg-sand-warm px-2 py-1.5 font-mono text-ink">
            {step.secret.secretKey}
          </code>
        </details>
        {codeInput}
        {errorBlock}
        <button type="submit" disabled={submitting || code.length !== 6} className={buttonClass}>
          {submitting ? "Turning on…" : "Turn on 2FA"}
        </button>
        <button type="button" onClick={backToPassword} className="w-full text-sm text-ink-muted hover:text-ink">
          Cancel
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handlePassword} className="space-y-5">
      {notice && <p className="rounded-lg bg-sand-warm px-3 py-2 text-sm text-ink">{notice}</p>}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {errorBlock}

      <button type="submit" disabled={submitting} className={buttonClass}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
