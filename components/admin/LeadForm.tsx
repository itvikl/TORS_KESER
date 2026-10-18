"use client";

import { useActionState } from "react";
import { createLeadManually, updateLead, type LeadFormState } from "@/lib/actions/leads";
import type { Lead, Tour } from "@/lib/types";

const initialState: LeadFormState = { ok: false, errors: {} };

/** Admin lead form — creates a lead, or edits every field of `lead` when one is passed. */
export default function LeadForm({ tours, lead }: { tours: Tour[]; lead?: Lead }) {
  const [state, formAction, pending] = useActionState(
    lead ? updateLead.bind(null, lead.leadId) : createLeadManually,
    initialState
  );
  const errors = state.ok ? {} : state.errors;

  return (
    <form action={formAction} className="grid max-w-2xl gap-5 rounded-xl border border-line bg-white p-6">
      {errors.form && (
        <p className="rounded-lg bg-terracotta-dark/10 px-3 py-2 text-sm text-terracotta-dark">
          {errors.form[0]}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" defaultValue={lead?.name} error={errors.name} />
        <Field label="Email" name="email" type="email" defaultValue={lead?.email} error={errors.email} />
        <Field label="Phone" name="phone" type="tel" defaultValue={lead?.phone} error={errors.phone} />
        <Field label="Country" name="country" defaultValue={lead?.country} error={errors.country} />
        <Field
          label="Destination"
          name="destination"
          defaultValue={lead?.destination}
          error={errors.destination}
        />
        <Field
          label="Group size"
          name="groupSize"
          type="number"
          defaultValue={lead?.groupSize?.toString()}
          error={errors.groupSize}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="tourId">
          Tour (optional)
        </label>
        <select
          id="tourId"
          name="tourId"
          defaultValue={lead?.tourId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        >
          <option value="">— None —</option>
          {tours.map((tour) => (
            <option key={tour.tourId} value={tour.tourId}>
              {tour.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          defaultValue={lead?.message}
          className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        />
        {errors.message && <p className="mt-1 text-xs text-terracotta-dark">{errors.message[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={lead?.notes}
          placeholder="Internal only — calls, follow-ups, what was discussed…"
          className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        />
        {errors.notes && <p className="mt-1 text-xs text-terracotta-dark">{errors.notes[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={lead?.status ?? "new"}
          className="mt-1.5 w-full max-w-xs rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="closed">Closed</option>
        </select>
        {errors.status && <p className="mt-1 text-xs text-terracotta-dark">{errors.status[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
      >
        {pending ? "Saving…" : lead ? "Save changes" : "Save lead"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  error?: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
      />
      {error && <p className="mt-1 text-xs text-terracotta-dark">{error[0]}</p>}
    </div>
  );
}
