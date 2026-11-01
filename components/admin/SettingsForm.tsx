"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormDirty, useToast } from "@/components/admin/feedback/AdminFeedbackProvider";
import UnsavedIndicator from "@/components/admin/feedback/UnsavedIndicator";
import { saveSettings, type SaveSettingsState } from "@/lib/actions/settings";
import type { SiteSettings } from "@/lib/types";

const initialState: SaveSettingsState = { ok: true };

export default function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState(saveSettings, initialState);
  const errors = state.ok ? {} : state.errors;
  const toast = useToast();
  const { isDirty, markSaved, formProps } = useFormDirty();

  // React to each completed submission (the initial state is skipped).
  const lastState = useRef(state);
  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.ok) {
      markSaved();
      toast.success({ title: "Settings saved", description: "Your site settings were updated successfully." });
    } else {
      toast.error({ title: "Settings not saved", description: "Please fix the highlighted fields and try again." });
    }
  }, [state, markSaved, toast]);

  return (
    <form action={formAction} {...formProps} className="max-w-xl space-y-4 rounded-xl border border-line bg-white p-6">

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" name="phone" defaultValue={settings.phone} error={errors.phone} />
        <Field label="Alternate phone" name="phoneAlt" defaultValue={settings.phoneAlt} error={errors.phoneAlt} />
        <Field label="Email" name="email" type="email" defaultValue={settings.email} error={errors.email} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Default deposit ($/person)"
          name="defaultDepositAmount"
          type="number"
          defaultValue={String(settings.defaultDepositAmount)}
          error={errors.defaultDepositAmount}
        />
        <Field
          label="Default minimum group size"
          name="defaultMinGroupSize"
          type="number"
          defaultValue={String(settings.defaultMinGroupSize)}
          error={errors.defaultMinGroupSize}
        />
        <Field
          label="Default balance due (days before departure)"
          name="defaultBalanceDueDays"
          type="number"
          defaultValue={String(settings.defaultBalanceDueDays)}
          error={errors.defaultBalanceDueDays}
        />
        <Field
          label="Default company cancel deadline (days)"
          name="defaultCompanyCancelDeadlineDays"
          type="number"
          defaultValue={String(settings.defaultCompanyCancelDeadlineDays)}
          error={errors.defaultCompanyCancelDeadlineDays}
        />
        <Field
          label="Low seats threshold (customer-facing)"
          name="lowSeatsThreshold"
          type="number"
          defaultValue={String(settings.lowSeatsThreshold)}
          error={errors.lowSeatsThreshold}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
      {isDirty && <span className="ms-3"><UnsavedIndicator /></span>}
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
