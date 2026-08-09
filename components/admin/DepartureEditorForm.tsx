"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDeparture } from "@/lib/actions/departures";
import { availableSeats, type Departure, type DepartureStatus, type Staff, type Tour } from "@/lib/types";

interface DepartureDraft {
  startDate: string;
  endDate: string;
  capacityTotal: number;
  status: DepartureStatus;
  minGroupSizeMet: boolean;
  guideId?: string;
  kashrutSupervisorId?: string;
}

const BLANK: DepartureDraft = {
  startDate: "",
  endDate: "",
  capacityTotal: 0,
  status: "open",
  minGroupSizeMet: false,
  guideId: undefined,
  kashrutSupervisorId: undefined,
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
  const [draft, setDraft] = useState<DepartureDraft>(initialDeparture ?? BLANK);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);

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

    router.push(`/admin/tours/${tourId}/departures`);
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
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-terracotta-dark">{error[0]}</p>}
    </div>
  );
}
