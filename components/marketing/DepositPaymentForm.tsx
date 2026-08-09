"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripe/client";
import { formatUsd } from "@/lib/pricing";

export default function DepositPaymentForm({
  clientSecret,
  amount,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}) {
  return (
    <Elements
      stripe={getStripeClient()}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#7dd3fc",
            colorBackground: "rgba(15,21,36,0.4)",
            colorText: "#e0e8f0",
            colorDanger: "#f87171",
            borderRadius: "12px",
          },
        },
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
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}
      <button
        type="button"
        disabled={submitting || !stripe}
        onClick={handlePay}
        className="w-full rounded-full bg-[#7dd3fc] px-8 py-3.5 text-sm font-bold text-[#001f2e] shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-60"
      >
        {submitting ? "Processing…" : `Pay ${formatUsd(amount)} deposit`}
      </button>
    </div>
  );
}
