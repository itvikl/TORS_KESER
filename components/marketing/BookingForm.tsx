"use client";

import { useMemo, useState } from "react";
import { availableSeats, type Departure, type Occupancy, type RoomConfiguration, type Tour } from "@/lib/types";
import { calculatePriceBreakdown, formatUsd } from "@/lib/pricing";
import { DEFAULT_ADMIN_FEE, DEFAULT_CANCELLATION_TIERS } from "@/lib/cancellationPolicy";
import { createBooking } from "@/lib/actions/bookings";
import { createDepositPaymentIntent } from "@/lib/actions/payments";
import DepositPaymentForm from "@/components/marketing/DepositPaymentForm";

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

const SELECTED_OPTION =
  "border-[#7dd3fc] bg-[#7dd3fc]/10";
const IDLE_OPTION =
  "border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.4)] hover:border-[rgba(125,211,252,0.25)]";

export default function BookingForm({
  tour,
  departures,
  lowSeatsThreshold,
}: {
  tour: Tour;
  departures: Departure[];
  /** At/below this remaining-seats count, the exact number + a "last spots" badge are shown; above it, only a vague "plenty available" message. */
  lowSeatsThreshold: number;
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
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSetupError, setPaymentSetupError] = useState<string | null>(null);

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
    setPaymentSetupError(null);

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

    if (contactPreference === "pay_online") {
      const intentResult = await createDepositPaymentIntent(result.bookingId);
      setSubmitting(false);
      if (!intentResult.ok) {
        setPaymentSetupError(intentResult.error);
        setConfirmedId(result.bookingId);
        return;
      }
      setPaymentBookingId(result.bookingId);
      setClientSecret(intentResult.clientSecret);
      return;
    }

    setConfirmedId(result.bookingId);
    setSubmitting(false);
  }

  if (confirmedId) {
    return (
      <Confirmation
        contactPreference={contactPreference}
        paymentSetupFailed={!!paymentSetupError}
      />
    );
  }

  if (clientSecret && paymentBookingId) {
    return (
      <div className="glass-panel-elevated overflow-hidden rounded-3xl p-6 shadow-2xl sm:p-8">
        <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">Pay your deposit</h2>
        <p className="mt-2 text-[15px] text-[#a0b4c4]">
          Your registration is saved. Complete your {formatUsd(depositAmount)} deposit below to
          confirm your spot.
        </p>
        <div className="mt-6">
          <DepositPaymentForm
            clientSecret={clientSecret}
            amount={depositAmount}
            onSuccess={() => setConfirmedId(paymentBookingId)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel-elevated overflow-hidden rounded-3xl shadow-2xl">
      <StepIndicator step={step} />

      <div className="p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">
              Choose a departure
            </h2>
            <BookingAssuranceNote assurance={tour.bookingAssurance ?? "conditional"} />
            <div className="space-y-3">
              {departures.map((d) => (
                <label
                  key={d.departureId}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-4 text-[15px] transition-all ${
                    departureId === d.departureId ? SELECTED_OPTION : IDLE_OPTION
                  }`}
                >
                  <span className="flex items-center gap-3 text-[#e0e8f0]">
                    <input
                      type="radio"
                      name="departure"
                      checked={departureId === d.departureId}
                      onChange={() => setDepartureId(d.departureId)}
                      className="accent-[#7dd3fc]"
                    />
                    {new Date(d.startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <SeatAvailabilityBadge
                    seats={availableSeats(d)}
                    threshold={lowSeatsThreshold}
                  />
                </label>
              ))}
            </div>
            <StepNav onNext={() => setStep(2)} nextDisabled={!departureId} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">
              Party size &amp; rooms
            </h2>
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

            <div className="rounded-xl border border-[rgba(125,211,252,0.15)] bg-[#7dd3fc]/10 p-4 text-[15px]">
              <p className="font-semibold text-[#e0e8f0]">
                {totalTravelers} traveler{totalTravelers === 1 ? "" : "s"} · Estimated total{" "}
                <span className="text-[#7dd3fc]">{formatUsd(priceBreakdown.grandTotal)}</span>
              </p>
              <p className="mt-1 text-[#a0b4c4]">
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
          <div className="space-y-5">
            <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">
              Traveler details
            </h2>
            {travelers.map((traveler, index) => (
              <div
                key={index}
                className="rounded-xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.4)] p-4 sm:p-5"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#7dd3fc]">
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
          <div className="space-y-5">
            <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">
              Contact information
            </h2>
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
            <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">
              Review &amp; submit
            </h2>

            <dl className="grid gap-3 rounded-xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.5)] p-5 text-[15px]">
              <Row
                label="Departure"
                value={new Date(departure.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              />
              <Row label="Travelers" value={String(totalTravelers)} />
              <Row label="Estimated total" value={formatUsd(priceBreakdown.grandTotal)} accent />
              <Row label="Deposit due to register" value={formatUsd(depositAmount)} />
              <Row
                label="Balance due"
                value={`${tour.pricing.balanceDueDaysBeforeDeparture} days before departure`}
              />
            </dl>

            <div className="rounded-xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.4)] p-4 text-sm text-[#a0b4c4]">
              <p className="mb-2 font-semibold text-[#e0e8f0]">Cancellation policy</p>
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

            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-semibold text-[#e0e8f0]">
                How would you like to complete payment?
              </legend>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-[15px] transition-all ${
                  contactPreference === "callback" ? SELECTED_OPTION : IDLE_OPTION
                }`}
              >
                <input
                  type="radio"
                  className="mt-1 accent-[#7dd3fc]"
                  checked={contactPreference === "callback"}
                  onChange={() => setContactPreference("callback")}
                />
                <span>
                  <span className="block font-semibold text-[#e0e8f0]">
                    A representative will call me
                  </span>
                  <span className="text-[#a0b4c4]">
                    We&apos;ll reach out within one business day to arrange your deposit.
                  </span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-[15px] transition-all ${
                  contactPreference === "pay_online" ? SELECTED_OPTION : IDLE_OPTION
                }`}
              >
                <input
                  type="radio"
                  className="mt-1 accent-[#7dd3fc]"
                  checked={contactPreference === "pay_online"}
                  onChange={() => setContactPreference("pay_online")}
                />
                <span>
                  <span className="block font-semibold text-[#e0e8f0]">
                    I&apos;d like to pay online
                  </span>
                  <span className="text-[#a0b4c4]">
                    Pay your deposit securely by card right after you submit.
                  </span>
                </span>
              </label>
            </fieldset>

            {Object.values(errors).flat().filter(Boolean).length > 0 && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                {Object.values(errors)
                  .flat()
                  .filter(Boolean)
                  .map((message) => (
                    <p key={message}>{message}</p>
                  ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-sm font-semibold text-[#a0b4c4] transition hover:text-[#7dd3fc]"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="rounded-full bg-[#7dd3fc] px-8 py-3.5 text-sm font-bold text-[#001f2e] shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Registration"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Confirmation({
  contactPreference,
  paymentSetupFailed = false,
}: {
  contactPreference: "callback" | "pay_online";
  paymentSetupFailed?: boolean;
}) {
  const message = paymentSetupFailed
    ? "Thank you! We couldn't start online payment just now, but your registration is saved — a member of our team will follow up shortly to collect your deposit."
    : contactPreference === "callback"
      ? "Thank you! A member of our team will call you within one business day to confirm details and arrange your deposit."
      : "Thank you! Your deposit has been received and your spot is confirmed.";

  return (
    <div className="glass-panel-elevated rounded-3xl p-8 text-center shadow-2xl sm:p-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#7dd3fc]/40 bg-[#7dd3fc]/20 text-4xl text-[#7dd3fc]">
        ✓
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[#7dd3fc]">
        Registration received
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold text-[#e0e8f0] sm:text-3xl">
        We look forward to welcoming you
      </h2>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-[#a0b4c4]">{message}</p>
      <a
        href="tel:18008470700"
        className="mt-8 inline-block text-sm font-bold text-[#7dd3fc] transition hover:brightness-110"
      >
        Questions? Call 1-800-847-0700
      </a>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="grid grid-cols-2 gap-2 border-b border-white/5 bg-[#0a0e1a]/80 px-4 py-4 text-center text-xs sm:grid-cols-5 sm:gap-0 sm:px-6">
      {STEP_LABELS.map((label, index) => {
        const active = index + 1 <= step;
        const current = index + 1 === step;
        return (
          <li
            key={label}
            className={`flex items-center justify-center gap-2 ${
              active ? "font-bold text-[#7dd3fc]" : "text-[#a0b4c4]/50"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                current
                  ? "bg-[#7dd3fc] text-[#001f2e]"
                  : active
                    ? "bg-[#7dd3fc]/20 text-[#7dd3fc]"
                    : "bg-white/10 text-[#a0b4c4]/50"
              }`}
            >
              {index + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </li>
        );
      })}
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
    <div className="flex items-center justify-between border-t border-white/10 pt-6">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-[#a0b4c4] transition hover:text-[#7dd3fc]"
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
        className="rounded-full bg-[#7dd3fc] px-8 py-3.5 text-sm font-bold text-[#001f2e] shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[#a0b4c4]">{label}</dt>
      <dd className={`font-semibold ${accent ? "text-[#7dd3fc]" : "text-[#e0e8f0]"}`}>
        {value}
      </dd>
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
    <div className="flex h-full flex-col">
      <label className="mb-1.5 block min-h-[2.5rem] text-xs font-bold uppercase tracking-widest text-[#a0b4c4]">
        <span className="block">{label}</span>
        <span className="block font-normal normal-case tracking-normal opacity-80">
          {hint ? `(${hint})` : "\u00A0"}
        </span>
      </label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="glacier-field mt-auto w-full"
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
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#a0b4c4]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glacier-field w-full"
      />
    </div>
  );
}

/** Exact number + "last spots" only at/below threshold — otherwise a vague, non-numeric message. */
function SeatAvailabilityBadge({
  seats,
  threshold,
}: {
  seats: number;
  threshold: number;
}) {
  if (seats <= threshold) {
    return (
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <span className="rounded-full bg-[#c8a0f0]/20 px-2 py-0.5 text-[#c8a0f0]">
          Last spots
        </span>
        <span className="text-[#a0b4c4]">{seats} spots left</span>
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-[#a0b4c4]">
      Plenty of spots available
    </span>
  );
}

/** Tour-level trust badge — constant across every departure, shown once above the date picker. */
function BookingAssuranceNote({ assurance }: { assurance: "conditional" | "guaranteed" }) {
  if (assurance === "guaranteed") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#10b981]/20 bg-[#10b981]/10 px-4 py-3 text-sm font-medium text-[#10b981]">
        <span aria-hidden="true">✓</span>
        Guaranteed to run — this tour is confirmed regardless of group size.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#a0b4c4]">
      Subject to registration — this tour departs once enough travelers have joined.
    </div>
  );
}
