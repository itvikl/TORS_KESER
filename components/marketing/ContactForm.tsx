"use client";

import { useActionState } from "react";
import { submitContactLead, type LeadFormState } from "@/lib/actions/leads";

const initialState: LeadFormState = { ok: false, errors: {} };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactLead, initialState);

  if (state.ok) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <p className="text-lg font-bold text-[#e0e8f0]">
          Thank you — your message was received.
        </p>
        <p className="mt-2 text-[15px] leading-7 text-[#a0b4c4]">
          A member of our team will get back to you shortly.
        </p>
      </div>
    );
  }

  const errors = state.errors;

  return (
    <form action={formAction} className="glass-panel grid gap-5 rounded-2xl p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">Send us a message</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your Name" name="name" required error={errors.name} />
        <Field label="Email" name="email" type="email" required error={errors.email} />
        <Field label="Telephone" name="phone" type="tel" />
        <Field label="Country" name="country" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#a0b4c4]" htmlFor="message">
          Question or Comment
        </label>
        <textarea id="message" name="message" rows={4} className="glacier-field mt-1.5 w-full" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-full bg-[#7dd3fc] px-7 py-3 text-sm font-bold text-[#001f2e] transition hover:brightness-110 active:scale-95 disabled:opacity-60"
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
      <label className="block text-sm font-medium text-[#a0b4c4]" htmlFor={name}>
        {label}
        {required && <span className="text-[#7dd3fc]"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="glacier-field mt-1.5 w-full"
      />
      {error && <p className="mt-1 text-xs text-red-300">{error[0]}</p>}
    </div>
  );
}
