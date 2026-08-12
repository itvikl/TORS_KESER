"use client";

import { useState } from "react";
import { createBalanceCheckoutSession } from "@/lib/actions/bookings";

export default function PayBalanceButton({
  bookingId,
  token,
  label,
}: {
  bookingId: string;
  token: string;
  label: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);

    const result = await createBalanceCheckoutSession(bookingId, token);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Leaving the page for Stripe Checkout — keep the button disabled and
    // skip setSubmitting(false) so there's no flash of re-enabled UI.
    window.location.href = result.checkoutUrl;
  }

  return (
    <div>
      <button
        type="button"
        disabled={submitting}
        onClick={handleClick}
        className="rounded-full bg-[#7dd3fc] px-8 py-3.5 text-sm font-bold text-[#001f2e] shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-60"
      >
        {submitting ? "Redirecting…" : label}
      </button>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}
