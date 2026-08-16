"use client";

import { useState } from "react";
import DepositPaymentForm from "@/components/marketing/DepositPaymentForm";

/** Client wrapper around the embedded Stripe Elements form for a balance top-up on /pay/[bookingId]. */
export default function PayBalanceButton({
  clientSecret,
  amount,
}: {
  clientSecret: string;
  amount: number;
}) {
  const [paid, setPaid] = useState(false);

  if (paid) {
    return (
      <p className="text-sm font-semibold text-[var(--color-success)]">
        Payment received — thank you! Your balance is now paid in full.
      </p>
    );
  }

  return (
    <div className="text-left">
      <DepositPaymentForm clientSecret={clientSecret} amount={amount} onSuccess={() => setPaid(true)} />
    </div>
  );
}
