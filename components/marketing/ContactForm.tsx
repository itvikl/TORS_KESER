"use client";

import { useActionState } from "react";
import { submitContactLead, type LeadFormState } from "@/lib/actions/leads";

const initialState: LeadFormState = { ok: false, errors: {} };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactLead, initialState);

  if (state.ok) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <p className="text-lg font-bold text-[var(--color-mist)]">
          Thank you — your message was received.
        </p>
        <p className="mt-2 text-[15px] leading-7 text-[var(--color-slate)]">
          A member of our team will get back to you shortly.
        </p>
      </div>
    );
  }

  const errors = state.errors;

  return (
    <form action={formAction} className="glass-panel grid gap-5 rounded-2xl p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-[var(--color-mist)]">Send us a message</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your Name" name="name" required error={errors.name} />
        <Field label="Email" name="email" type="email" required error={errors.email} />
        <Field label="Telephone" name="phone" type="tel" />
        <Field label="Country" name="country" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--color-slate)]" htmlFor="message">
          Question or Comment
        </label>
        <textarea id="message" name="message" rows={4} className="glacier-field mt-1.5 w-full" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-full bg-[var(--color-ice)] px-7 py-3 text-sm font-bold text-[var(--color-ice-ink)] transition hover:brightness-110 active:scale-95 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-slate)]" htmlFor={name}>
        {label}
        {required && <span className="text-[var(--color-ice)]"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="glacier-field mt-1.5 w-full"
      />
      {error && <p className="mt-1 text-xs text-[var(--color-danger-text)]">{error[0]}</p>}
    </div>
  );
}
