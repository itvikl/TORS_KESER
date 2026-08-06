"use client";

import { useActionState } from "react";
import { submitCustomTourLead, type LeadFormState } from "@/lib/actions/leads";

const initialState: LeadFormState = { ok: false, errors: {} };

export default function CustomTourForm() {
  const [state, formAction, pending] = useActionState(submitCustomTourLead, initialState);

  if (state.ok) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <p className="text-lg font-bold text-[#e0e8f0]">
          Thank you — your request was received.
        </p>
        <p className="mt-2 text-[15px] leading-7 text-[#a0b4c4]">
          A member of our team will call you to start planning your trip.
        </p>
      </div>
    );
  }

  const errors = state.errors;

  return (
    <form action={formAction} className="glass-panel grid gap-5 rounded-2xl p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">
        Tell us about your group
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#a0b4c4]" htmlFor="destination">
            Destination
          </label>
          <input id="destination" name="destination" className="glacier-field mt-1.5 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a0b4c4]" htmlFor="groupSize">
            Approximate group size
          </label>
          <input
            id="groupSize"
            name="groupSize"
            type="number"
            min={1}
            className="glacier-field mt-1.5 w-full"
          />
          {errors.groupSize && (
            <p className="mt-1 text-xs text-red-300">{errors.groupSize[0]}</p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#a0b4c4]" htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="glacier-field mt-1.5 w-full"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-300">{errors.phone[0]}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-full bg-[#7dd3fc] px-7 py-3 text-sm font-bold text-[#001f2e] transition hover:brightness-110 active:scale-95 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Request a Custom Tour"}
      </button>
    </form>
  );
}
