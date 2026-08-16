"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { getStripeClient } from "@/lib/stripe/client";
import { formatUsd } from "@/lib/pricing";

/** Mirrors the CSS custom properties in app/globals.css — Stripe Elements renders in an
 * iframe, so it can't inherit our var(--color-*) tokens and needs literal values instead. */
const DARK_APPEARANCE: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#7dd3fc",
    colorBackground: "rgba(15,21,36,0.4)",
    colorText: "#e0e8f0",
    colorTextSecondary: "#a0b4c4",
    colorDanger: "#ff6b6b",
    borderRadius: "12px",
  },
};

const LIGHT_APPEARANCE: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#0284c7",
    colorBackground: "#ffffff",
    colorText: "#16202c",
    colorTextSecondary: "#55697a",
    colorDanger: "#dc2626",
    borderRadius: "12px",
  },
};

function currentAppearance() {
  return document.documentElement.dataset.theme === "light" ? LIGHT_APPEARANCE : DARK_APPEARANCE;
}

/** Tracks the site's light/dark toggle (set on <html data-theme>) so the Stripe iframe
 * stays in sync, including if the user flips it while the payment form is open. */
function useStripeAppearance(): Appearance {
  const [appearance, setAppearance] = useState<Appearance>(currentAppearance);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setAppearance(currentAppearance());
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return appearance;
}

export default function DepositPaymentForm({
  clientSecret,
  amount,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}) {
  const appearance = useStripeAppearance();

  return (
    <Elements
      stripe={getStripeClient()}
      options={{
        clientSecret,
        appearance,
      }}
    >
      <PaymentFields amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}

function PaymentFields({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please check your payment details.");
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onSuccess();
      return;
    }

    setError("Payment could not be completed. Please try a different payment method.");
    setSubmitting(false);
  }

  return (
    <div className="space-y-5">
      <PaymentElement />
      {error && (
        <div className="rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger-text)]">
          {error}
        </div>
      )}
      <button
        type="button"
        disabled={submitting || !stripe}
        onClick={handlePay}
        className="w-full rounded-full bg-[var(--color-ice)] px-8 py-3.5 text-sm font-bold text-[var(--color-ice-ink)] shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-60"
      >
        {submitting ? "Processing…" : `Pay ${formatUsd(amount)}`}
      </button>
    </div>
  );
}
