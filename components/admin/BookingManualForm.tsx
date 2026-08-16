"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  availableSeats,
  type BookingStatus,
  type ContactPreference,
  type Departure,
  type Occupancy,
  type RoomConfiguration,
  type Tour,
} from "@/lib/types";
import { calculatePriceBreakdown, formatUsd } from "@/lib/pricing";
import { createManualBooking } from "@/lib/actions/bookings";

interface TravelerDraft {
  firstName: string;
  lastName: string;
  dob: string;
  passport: string;
  occupancy: Occupancy;
  roomWith: string;
  dietary: string;
}

const BLANK_TRAVELER: Omit<TravelerDraft, "occupancy"> = {
  firstName: "",
  lastName: "",
  dob: "",
  passport: "",
  roomWith: "",
  dietary: "",
};

function buildOccupancySlots(room: RoomConfiguration, childCount: number): Occupancy[] {
  const slots: Occupancy[] = [];
  for (let i = 0; i < room.doubleRooms * 2; i++) slots.push("double");
  for (let i = 0; i < room.singleRooms; i++) slots.push("single");
  for (let i = 0; i < room.triples * 3; i++) slots.push("triple");
  for (let i = 0; i < childCount; i++) slots.push("child");
  return slots;
}

export default function BookingManualForm({
  tours,
  departures,
}: {
  tours: Tour[];
  departures: Departure[];
}) {
  const router = useRouter();
  const [tourId, setTourId] = useState(tours[0]?.tourId ?? "");
  const tourDepartures = useMemo(
    () => departures.filter((d) => d.tourId === tourId && d.status === "open"),
    [departures, tourId]
  );
  const [departureId, setDepartureId] = useState(tourDepartures[0]?.departureId ?? "");
  const [room, setRoom] = useState<RoomConfiguration>({ doubleRooms: 1, singleRooms: 0, triples: 0 });
  const [childCount, setChildCount] = useState(0);
  const [travelers, setTravelers] = useState<TravelerDraft[]>(() =>
    buildOccupancySlots({ doubleRooms: 1, singleRooms: 0, triples: 0 }, 0).map((occupancy) => ({
      ...BLANK_TRAVELER,
      occupancy,
    }))
  );
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactPreference, setContactPreference] = useState<ContactPreference>("callback");
  const [status, setStatus] = useState<BookingStatus>("partial_paid");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const tour = tours.find((t) => t.tourId === tourId);
  const totalTravelers = room.doubleRooms * 2 + room.singleRooms + room.triples * 3 + childCount;
  const priceBreakdown = useMemo(
    () => (tour ? calculatePriceBreakdown(tour.pricing, room, childCount) : null),
    [tour, room, childCount]
  );
  const depositAmount = tour ? tour.pricing.depositAmountPerPerson * totalTravelers : 0;

  function selectTour(id: string) {
    setTourId(id);
    const first = departures.find((d) => d.tourId === id && d.status === "open");
    setDepartureId(first?.departureId ?? "");
  }

  function syncTravelerSlots(nextRoom: RoomConfiguration, nextChildCount: number) {
    const slots = buildOccupancySlots(nextRoom, nextChildCount);
    setTravelers((prev) => slots.map((occupancy, i) => ({ ...(prev[i] ?? BLANK_TRAVELER), occupancy })));
  }

  function updateRoom(patch: Partial<RoomConfiguration>) {
    setRoom((prev) => {
      const next = { ...prev, ...patch };
      syncTravelerSlots(next, childCount);
      return next;
    });
  }

  function updateChildCount(value: number) {
    setChildCount(value);
    syncTravelerSlots(room, value);
  }

  function updateTraveler(index: number, patch: Partial<TravelerDraft>) {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  async function handleSave() {
    setSaving(true);
    setErrors({});

    const result = await createManualBooking({
      departureId,
      roomConfiguration: room,
      childCount,
      travelers: travelers.map((t) => ({
        firstName: t.firstName,
        lastName: t.lastName,
        dob: t.dob || undefined,
        passport: t.passport || undefined,
        occupancy: t.occupancy,
        roomWith: t.roomWith || undefined,
        dietary: t.dietary || undefined,
      })),
      contactName,
      contactEmail,
      contactPhone: contactPhone || undefined,
      contactPreference,
      status,
    });

    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      return;
    }

    router.push("/admin/bookings");
  }

  const errorList = Object.values(errors).flat().filter((m): m is string => Boolean(m));

  return (
    <div className="max-w-3xl space-y-6">
      <Section title="Tour & departure">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tour">
            <select
              value={tourId}
              onChange={(e) => selectTour(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              {tours.map((t) => (
                <option key={t.tourId} value={t.tourId}>
                  {t.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Departure" error={errors.departureId}>
            <select
              value={departureId}
              onChange={(e) => setDepartureId(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="">— Choose a date —</option>
              {tourDepartures.map((d) => (
                <option key={d.departureId} value={d.departureId}>
                  {new Date(d.startDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {availableSeats(d)} spots left
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Party size & rooms">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumberField label="Double rooms" value={room.doubleRooms} onChange={(v) => updateRoom({ doubleRooms: v })} />
          <NumberField label="Single rooms" value={room.singleRooms} onChange={(v) => updateRoom({ singleRooms: v })} />
          <NumberField label="Triple rooms" value={room.triples} onChange={(v) => updateRoom({ triples: v })} />
          <NumberField label="Children" value={childCount} onChange={updateChildCount} />
        </div>
        {priceBreakdown && (
          <p className="mt-4 rounded-lg bg-sand-warm px-4 py-3 text-sm text-ink">
            {totalTravelers} traveler{totalTravelers === 1 ? "" : "s"} · Total{" "}
            <span className="font-semibold">{formatUsd(priceBreakdown.grandTotal)}</span> · Deposit{" "}
            <span className="font-semibold">{formatUsd(depositAmount)}</span>
          </p>
        )}
      </Section>

      <Section title="Travelers">
        <div className="space-y-4">
          {travelers.map((traveler, index) => (
            <div key={index} className="rounded-lg border border-line p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Traveler {index + 1} · {traveler.occupancy}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="First name" value={traveler.firstName} onChange={(v) => updateTraveler(index, { firstName: v })} />
                <TextField label="Last name" value={traveler.lastName} onChange={(v) => updateTraveler(index, { lastName: v })} />
                <TextField label="Date of birth" type="date" value={traveler.dob} onChange={(v) => updateTraveler(index, { dob: v })} />
                <TextField label="Passport number" value={traveler.passport} onChange={(v) => updateTraveler(index, { passport: v })} />
                <TextField label="Dietary needs" value={traveler.dietary} onChange={(v) => updateTraveler(index, { dietary: v })} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Contact & status">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Contact name" value={contactName} onChange={setContactName} />
          <TextField label="Email" type="email" value={contactEmail} onChange={setContactEmail} />
          <TextField label="Phone" type="tel" value={contactPhone} onChange={setContactPhone} />
          <Field label="Contact preference">
            <select
              value={contactPreference}
              onChange={(e) => setContactPreference(e.target.value as ContactPreference)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="callback">Call back</option>
              <option value="pay_online">Pay online</option>
            </select>
          </Field>
          <Field label="Status" hint="No Stripe step here — set what actually happened.">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatus)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="pending_payment">Pending payment</option>
              <option value="partial_paid">Partially paid</option>
              <option value="paid_in_full">Paid in full</option>
            </select>
          </Field>
        </div>
      </Section>

      {errorList.length > 0 && (
        <div className="rounded-lg border border-terracotta/30 bg-terracotta/10 p-3 text-sm text-terracotta-dark">
          {errorList.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={saving || !departureId}
        onClick={handleSave}
        className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
      >
        {saving ? "Saving…" : "Create booking"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      {children}
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

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
      />
    </Field>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
      />
    </Field>
  );
}
