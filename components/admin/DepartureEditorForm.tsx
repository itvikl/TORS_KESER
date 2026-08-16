"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDeparture, type BalancePaymentLink } from "@/lib/actions/departures";
import {
  availableSeats,
  type BookingAssurance,
  type Departure,
  type DepartureStatus,
  type Staff,
  type Tour,
} from "@/lib/types";

interface DepartureDraft {
  startDate: string;
  endDate: string;
  capacityTotal: number;
  status: DepartureStatus;
  minGroupSizeMet: boolean;
  guideId?: string;
  kashrutSupervisorId?: string;
  bookingAssurance: BookingAssurance;
}

const BLANK: DepartureDraft = {
  startDate: "",
  endDate: "",
  capacityTotal: 0,
  status: "open",
  minGroupSizeMet: false,
  guideId: undefined,
  kashrutSupervisorId: undefined,
  bookingAssurance: "conditional",
};

export default function DepartureEditorForm({
  mode,
  tourId,
  departureId,
  initialDeparture,
  tour,
  staff,
}: {
  mode: "create" | "edit";
  tourId: string;
  departureId?: string;
  initialDeparture?: Departure;
  tour: Tour;
  staff: Staff[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<DepartureDraft>(
    initialDeparture
      ? { ...initialDeparture, bookingAssurance: initialDeparture.bookingAssurance ?? "conditional" }
      : BLANK
  );
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [balancePaymentLinks, setBalancePaymentLinks] = useState<BalancePaymentLink[] | null>(null);

  const guides = staff.filter((s) => s.role === "guide");
  const kashrutSupervisors = staff.filter((s) => s.role === "kashrutSupervisor");

  function set<K extends keyof DepartureDraft>(key: K, value: DepartureDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setErrors({});

    const result = await saveDeparture(draft, tourId, departureId);
    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      return;
    }

    if (result.balancePaymentLinks.length > 0) {
      // This departure just flipped to "guaranteed" and some customers already
      // paid something — no real email sending exists yet (deferred), so
      // staff get the links here to send manually. See coral-wandering-lantern.md.
      setBalancePaymentLinks(result.balancePaymentLinks);
      setSaving(false);
      return;
    }

    router.push(`/admin/tours/${tourId}/departures`);
  }

  if (balancePaymentLinks) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="rounded-xl border border-terracotta/30 bg-terracotta/10 p-4">
          <p className="font-semibold text-ink">
            This departure is now guaranteed — {balancePaymentLinks.length} customer
            {balancePaymentLinks.length === 1 ? "" : "s"} who already paid something still owe a
            balance.
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            There&apos;s no automatic email yet — send these links manually (phone, WhatsApp, or
            your own email) until that&apos;s set up.
          </p>
        </div>
        <div className="space-y-3">
          {balancePaymentLinks.map((link) => (
            <div key={link.bookingId} className="rounded-xl border border-line bg-white p-4">
              <p className="text-sm font-semibold text-ink">
                {link.contactName} · ${link.balanceAmount} balance due
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={link.url}
                  className="w-full rounded-lg border border-line bg-sand-warm px-3 py-1.5 text-xs text-ink"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(link.url)}
                  className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand-warm"
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => router.push(`/admin/tours/${tourId}/departures`)}
          className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      {initialDeparture && (
        <div className="rounded-xl border border-line bg-sand-warm p-4 text-sm text-ink">
          <p>
            <span className="font-semibold">{initialDeparture.capacityBooked}</span> booked ·{" "}
            <span className="font-semibold">{initialDeparture.capacityHeld}</span> held ·{" "}
            <span className="font-semibold">{availableSeats(initialDeparture)}</span> available out of{" "}
            {initialDeparture.capacityTotal}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Balance due date: {initialDeparture.balanceDueDate} (computed from the start date and the
            tour&apos;s balance-due policy — {tour.pricing.balanceDueDaysBeforeDeparture} days).
          </p>
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-line bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" error={errors.startDate}>
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field label="End date" error={errors.endDate}>
            <input
              type="date"
              value={draft.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Maximum capacity" error={errors.capacityTotal}>
            <input
              type="number"
              min={0}
              value={draft.capacityTotal}
              onChange={(e) => set("capacityTotal", Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>
          <Field label="Status" error={errors.status}>
            <select
              value={draft.status}
              onChange={(e) => set("status", e.target.value as DepartureStatus)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="soldout">Sold out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
        </div>

        <Field
          label="Booking assurance"
          hint="Shown to customers on the booking page — a manual editorial call, independent of the actual minimum-group-size numbers. Flipping to Guaranteed will surface payment links for anyone who already paid something on this date."
        >
          <select
            value={draft.bookingAssurance}
            onChange={(e) => set("bookingAssurance", e.target.value as BookingAssurance)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="conditional">Conditional — requires minimum group size</option>
            <option value="guaranteed">Guaranteed to run</option>
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Guide">
            <select
              value={draft.guideId ?? ""}
              onChange={(e) => set("guideId", e.target.value || undefined)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="">— None —</option>
              {guides.map((g) => (
                <option key={g.staffId} value={g.staffId}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kashrut supervisor">
            <select
              value={draft.kashrutSupervisorId ?? ""}
              onChange={(e) => set("kashrutSupervisorId", e.target.value || undefined)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="">— None —</option>
              {kashrutSupervisors.map((s) => (
                <option key={s.staffId} value={s.staffId}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={draft.minGroupSizeMet}
            onChange={(e) => set("minGroupSizeMet", e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Minimum group size met
            <span className="block text-xs text-ink-muted">
              Internal only — never shown to customers.
            </span>
          </span>
        </label>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
      >
        {saving ? "Saving…" : mode === "create" ? "Create departure" : "Save changes"}
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-terracotta-dark">{error[0]}</p>}
    </div>
  );
}
