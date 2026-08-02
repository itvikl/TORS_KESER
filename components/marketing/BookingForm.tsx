"use client";

import { useMemo, useState } from "react";
import type { Departure, Occupancy, RoomConfiguration, Tour } from "@/lib/types";
import { calculatePriceBreakdown, formatUsd } from "@/lib/pricing";
import { DEFAULT_ADMIN_FEE, DEFAULT_CANCELLATION_TIERS } from "@/lib/cancellationPolicy";
import { createBooking } from "@/lib/actions/bookings";

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

const STEP_LABELS = ["Dates", "Party size", "Travelers", "Contact", "Review"];

export default function BookingForm({
  tour,
  departures,
}: {
  tour: Tour;
  departures: Departure[];
}) {
  const [step, setStep] = useState(1);
  const [departureId, setDepartureId] = useState(departures[0]?.departureId ?? "");
  const [room, setRoom] = useState<RoomConfiguration>({
    doubleRooms: 1,
    singleRooms: 0,
    triples: 0,
  });
  const [childCount, setChildCount] = useState(0);
  const [travelers, setTravelers] = useState<TravelerDraft[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactPreference, setContactPreference] = useState<"callback" | "pay_online">(
    "callback"
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const departure = departures.find((d) => d.departureId === departureId);
  const totalTravelers = room.doubleRooms * 2 + room.singleRooms + room.triples * 3 + childCount;
  const priceBreakdown = useMemo(
    () => calculatePriceBreakdown(tour.pricing, room, childCount),
    [tour.pricing, room, childCount]
  );
  const depositAmount = tour.pricing.depositAmountPerPerson * totalTravelers;

  function goToTravelerStep() {
    const slots = buildOccupancySlots(room, childCount);
    setTravelers((prev) =>
      slots.map((occupancy, i) => ({ ...(prev[i] ?? BLANK_TRAVELER), occupancy }))
    );
    setStep(3);
  }

  function updateTraveler(index: number, patch: Partial<TravelerDraft>) {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  const travelersValid =
    travelers.length > 0 && travelers.every((t) => t.firstName.trim() && t.lastName.trim());

  async function handleSubmit() {
    setSubmitting(true);
    setErrors({});

    const result = await createBooking({
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
    });

    if (!result.ok) {
      setErrors(result.errors);
      setSubmitting(false);
      return;
    }

    setConfirmedId(result.bookingId);
    setSubmitting(false);
  }

  if (confirmedId) {
    return <Confirmation contactPreference={contactPreference} />;
  }

  return (
    <div className="rounded-2xl border border-line bg-white/70 p-6 sm:p-8">
      <StepIndicator step={step} />

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-navy">Choose a departure</h2>
          <div className="space-y-2">
            {departures.map((d) => (
              <label
                key={d.departureId}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-[15px] ${
                  departureId === d.departureId
                    ? "border-navy bg-sand-warm"
                    : "border-line bg-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="departure"
                    checked={departureId === d.departureId}
                    onChange={() => setDepartureId(d.departureId)}
                  />
                  {new Date(d.startDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {d.capacityTotal - d.capacityBooked - d.capacityHeld} spots left
                </span>
              </label>
            ))}
          </div>
          <StepNav onNext={() => setStep(2)} nextDisabled={!departureId} />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-navy">Party size &amp; rooms</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NumberField
              label="Double rooms"
              hint="2 adults each"
              value={room.doubleRooms}
              onChange={(v) => setRoom((r) => ({ ...r, doubleRooms: v }))}
            />
            <NumberField
              label="Single rooms"
              hint="1 adult each"
              value={room.singleRooms}
              onChange={(v) => setRoom((r) => ({ ...r, singleRooms: v }))}
            />
            <NumberField
              label="Triple rooms"
              hint="3 adults each"
              value={room.triples}
              onChange={(v) => setRoom((r) => ({ ...r, triples: v }))}
            />
            <NumberField label="Children" value={childCount} onChange={setChildCount} />
          </div>

          <div className="rounded-lg bg-sand-warm p-4 text-[15px]">
            <p className="font-semibold text-ink">
              {totalTravelers} traveler{totalTravelers === 1 ? "" : "s"} · Estimated total{" "}
              {formatUsd(priceBreakdown.grandTotal)}
            </p>
            <p className="mt-1 text-ink-muted">
              Deposit due to register: {formatUsd(depositAmount)}
            </p>
          </div>

          <StepNav
            onBack={() => setStep(1)}
            onNext={goToTravelerStep}
            nextDisabled={totalTravelers === 0}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-navy">Traveler details</h2>
          {travelers.map((traveler, index) => (
            <div key={index} className="rounded-lg border border-line p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-olive">
                Traveler {index + 1} · {traveler.occupancy}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="First name"
                  value={traveler.firstName}
                  onChange={(v) => updateTraveler(index, { firstName: v })}
                />
                <TextField
                  label="Last name"
                  value={traveler.lastName}
                  onChange={(v) => updateTraveler(index, { lastName: v })}
                />
                <TextField
                  label="Date of birth"
                  type="date"
                  value={traveler.dob}
                  onChange={(v) => updateTraveler(index, { dob: v })}
                />
                <TextField
                  label="Passport number"
                  value={traveler.passport}
                  onChange={(v) => updateTraveler(index, { passport: v })}
                />
                {(traveler.occupancy === "double" || traveler.occupancy === "triple") && (
                  <TextField
                    label="Rooming with"
                    value={traveler.roomWith}
                    onChange={(v) => updateTraveler(index, { roomWith: v })}
                  />
                )}
                <TextField
                  label="Dietary needs"
                  value={traveler.dietary}
                  onChange={(v) => updateTraveler(index, { dietary: v })}
                />
              </div>
            </div>
          ))}
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            nextDisabled={!travelersValid}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-navy">Contact information</h2>
          <TextField label="Your name" value={contactName} onChange={setContactName} />
          <TextField
            label="Email"
            type="email"
            value={contactEmail}
            onChange={setContactEmail}
          />
          <TextField label="Phone" type="tel" value={contactPhone} onChange={setContactPhone} />
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
            nextDisabled={!contactName.trim() || !contactEmail.trim()}
          />
        </div>
      )}

      {step === 5 && departure && (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-semibold text-navy">Review &amp; submit</h2>

          <dl className="grid gap-2 rounded-lg bg-sand-warm p-4 text-[15px]">
            <Row
              label="Departure"
              value={new Date(departure.startDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            />
            <Row label="Travelers" value={String(totalTravelers)} />
            <Row label="Estimated total" value={formatUsd(priceBreakdown.grandTotal)} />
            <Row label="Deposit due to register" value={formatUsd(depositAmount)} />
            <Row
              label="Balance due"
              value={`${tour.pricing.balanceDueDaysBeforeDeparture} days before departure`}
            />
          </dl>

          <div className="rounded-lg border border-line p-4 text-sm text-ink-muted">
            <p className="mb-2 font-semibold text-ink">Cancellation policy</p>
            <ul className="space-y-1">
              {DEFAULT_CANCELLATION_TIERS.map((tier) => (
                <li key={tier.minWorkingDaysBefore}>
                  {tier.minWorkingDaysBefore}+ working days before departure: {tier.chargePercent}
                  % charge
                </li>
              ))}
              <li>Plus a ${DEFAULT_ADMIN_FEE} admin fee.</li>
            </ul>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold text-ink">
              How would you like to complete payment?
            </legend>
            <label className="flex items-start gap-3 rounded-lg border border-line p-4 text-[15px] has-[:checked]:border-navy has-[:checked]:bg-sand-warm">
              <input
                type="radio"
                className="mt-1"
                checked={contactPreference === "callback"}
                onChange={() => setContactPreference("callback")}
              />
              <span>
                <span className="block font-semibold text-ink">A representative will call me</span>
                <span className="text-ink-muted">
                  We&apos;ll reach out within one business day to arrange your deposit.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-line p-4 text-[15px] has-[:checked]:border-navy has-[:checked]:bg-sand-warm">
              <input
                type="radio"
                className="mt-1"
                checked={contactPreference === "pay_online"}
                onChange={() => setContactPreference("pay_online")}
              />
              <span>
                <span className="block font-semibold text-ink">I&apos;d like to pay online</span>
                <span className="text-ink-muted">
                  Online payment is being set up — we&apos;ll email you a secure payment link
                  shortly.
                </span>
              </span>
            </label>
          </fieldset>

          {Object.values(errors).flat().filter(Boolean).length > 0 && (
            <div className="rounded-lg bg-terracotta/10 p-3 text-sm text-terracotta-dark">
              {Object.values(errors)
                .flat()
                .filter(Boolean)
                .map((message) => (
                  <p key={message}>{message}</p>
                ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="text-sm font-medium text-ink-muted hover:text-ink"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="rounded-lg bg-terracotta px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-terracotta-dark disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Registration"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Confirmation({ contactPreference }: { contactPreference: "callback" | "pay_online" }) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 p-8 text-center">
      <p className="mb-2 text-2xl">✓</p>
      <h2 className="font-display text-xl font-semibold text-navy">
        Registration received
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-muted">
        {contactPreference === "callback"
          ? "Thank you! A member of our team will call you within one business day to confirm details and arrange your deposit."
          : "Thank you! We're finishing setup for online payments — we'll email you a secure payment link shortly, or you're welcome to call us in the meantime."}
      </p>
      <a
        href="tel:18008470700"
        className="mt-6 inline-block text-sm font-semibold text-terracotta"
      >
        Questions? Call 1-800-847-0700
      </a>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide">
      {STEP_LABELS.map((label, index) => (
        <li
          key={label}
          className={index + 1 === step ? "text-navy" : "text-ink-muted/50"}
        >
          {index + 1}. {label}
        </li>
      ))}
    </ol>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        className="rounded-lg bg-navy px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {hint && <span className="ms-1 text-xs font-normal text-ink-muted">({hint})</span>}
      </label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[15px]"
      />
    </div>
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
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[15px]"
      />
    </div>
  );
}
