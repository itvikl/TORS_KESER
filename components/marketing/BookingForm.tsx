"use client";

import { useId, useMemo, useRef, useState } from "react";
import { availableSeats, type Departure, type Occupancy, type RoomConfiguration, type Tour } from "@/lib/types";
import { calculatePriceBreakdown, formatUsd } from "@/lib/pricing";
import { DEFAULT_ADMIN_FEE, DEFAULT_CANCELLATION_TIERS } from "@/lib/cancellationPolicy";
import { createBooking } from "@/lib/actions/bookings";
import { createDepositPaymentIntent } from "@/lib/actions/payments";
import { uploadPassportScan } from "@/lib/actions/uploads";
import DepositPaymentForm from "@/components/marketing/DepositPaymentForm";

interface TravelerDraft {
  firstName: string;
  lastName: string;
  dob: string;
  passport: string;
  passportScanUrl: string;
  passportScanFileName: string;
  occupancy: Occupancy;
  roomWith: string;
  dietary: string;
}

const BLANK_TRAVELER: Omit<TravelerDraft, "occupancy"> = {
  firstName: "",
  lastName: "",
  dob: "",
  passport: "",
  passportScanUrl: "",
  passportScanFileName: "",
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SELECTED_OPTION =
  "border-[var(--color-ice)] bg-[var(--color-ice)]/10";
const IDLE_OPTION =
  "border-[var(--color-border-ice)] bg-[var(--color-field-bg)] hover:border-[var(--color-border-ice-strong)]";

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
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSetupError, setPaymentSetupError] = useState<string | null>(null);
  const [paymentIntentAmount, setPaymentIntentAmount] = useState(0);
  // null = "not touched yet, follow the deposit floor as it changes with party size"; once
  // the customer drags the slider we stick to their chosen number (clamped into range below).
  const [customPaymentAmount, setCustomPaymentAmount] = useState<number | null>(null);

  const departure = departures.find((d) => d.departureId === departureId);
  const seatsLeft = departure ? availableSeats(departure) : 0;
  const isGuaranteed = departure?.bookingAssurance === "guaranteed";
  const totalTravelers = room.doubleRooms * 2 + room.singleRooms + room.triples * 3 + childCount;
  const priceBreakdown = useMemo(
    () => calculatePriceBreakdown(tour.pricing, room, childCount),
    [tour.pricing, room, childCount]
  );
  const depositAmount = tour.pricing.depositAmountPerPerson * totalTravelers;
  // Never trust this on the server — it's re-validated there against the
  // departure's bookingAssurance and [depositAmount, grandTotal] range. This
  // is just the UI's live value.
  const paymentAmount = isGuaranteed
    ? priceBreakdown.grandTotal
    : Math.min(Math.max(customPaymentAmount ?? depositAmount, depositAmount), priceBreakdown.grandTotal);

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

  /** Marks a field touched on blur, so its inline validation message only appears after the visitor has left it. */
  function touch(key: string) {
    setTouched((prev) => ({ ...prev, [key]: true }));
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
        passportScanUrl: t.passportScanUrl || undefined,
        occupancy: t.occupancy,
        roomWith: t.roomWith || undefined,
        dietary: t.dietary || undefined,
      })),
      contactName,
      contactEmail,
      contactPhone: contactPhone || undefined,
      contactPreference,
      paymentAmount,
    });

    if (!result.ok) {
      setErrors(result.errors);
      setSubmitting(false);
      return;
    }

    if (contactPreference === "pay_online" && result.initialPaymentAmount > 0) {
      const intentResult = await createDepositPaymentIntent(result.bookingId);
      setSubmitting(false);
      if (!intentResult.ok) {
        setPaymentSetupError(intentResult.error);
        setConfirmedId(result.bookingId);
        return;
      }
      setPaymentBookingId(result.bookingId);
      setClientSecret(intentResult.clientSecret);
      setPaymentIntentAmount(intentResult.amount);
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
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-mist)]">Complete your payment</h2>
        <p className="mt-2 text-[15px] text-[var(--color-slate)]">
          Your registration is saved. Complete your {formatUsd(paymentIntentAmount)} payment below
          to confirm your spot.
        </p>
        <div className="mt-6">
          <DepositPaymentForm
            clientSecret={clientSecret}
            amount={paymentIntentAmount}
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
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-mist)]">
              Choose a departure
            </h2>
            <div className="space-y-3">
              {departures.map((d) => (
                <label
                  key={d.departureId}
                  className={`flex cursor-pointer flex-col items-start gap-3 rounded-xl border px-4 py-4 text-[15px] transition-all sm:flex-row sm:items-center sm:justify-between ${
                    departureId === d.departureId ? SELECTED_OPTION : IDLE_OPTION
                  }`}
                >
                  <span className="flex flex-col gap-1">
                    <span className="flex items-center gap-3 text-[var(--color-mist)]">
                      <input
                        type="radio"
                        name="departure"
                        checked={departureId === d.departureId}
                        onChange={() => setDepartureId(d.departureId)}
                        className="accent-[var(--color-ice)]"
                      />
                      {new Date(d.startDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <AssuranceBadge assurance={d.bookingAssurance ?? "conditional"} />
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
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-mist)]">
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

            <div className="rounded-xl border border-[var(--color-border-ice-strong)] bg-[var(--color-ice)]/10 p-4 text-[15px]">
              <p className="font-semibold text-[var(--color-mist)]">
                {totalTravelers} traveler{totalTravelers === 1 ? "" : "s"} · Estimated total{" "}
                <span className="text-[var(--color-ice)]">{formatUsd(priceBreakdown.grandTotal)}</span>
              </p>
              <p className="mt-1 text-[var(--color-slate)]">
                {isGuaranteed
                  ? "This departure is guaranteed to run — full payment is required to reserve your spot."
                  : `Starting deposit: ${formatUsd(depositAmount)} — you'll choose how much to pay in the next step.`}
              </p>
            </div>

            {totalTravelers > seatsLeft && (
              <p className="rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger-text)]">
                Only {seatsLeft} spot{seatsLeft === 1 ? "" : "s"} left on this date — reduce the
                party size or choose another date.
              </p>
            )}

            <StepNav
              onBack={() => setStep(1)}
              onNext={goToTravelerStep}
              nextDisabled={totalTravelers === 0 || totalTravelers > seatsLeft}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-mist)]">
              Traveler details
            </h2>
            {travelers.map((traveler, index) => (
              <div
                key={index}
                className="rounded-xl border border-[var(--color-border-ice)] bg-[var(--color-field-bg)] p-4 sm:p-5"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-ice)]">
                  Traveler {index + 1} · {traveler.occupancy}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="First name"
                    value={traveler.firstName}
                    onChange={(v) => updateTraveler(index, { firstName: v })}
                    onBlur={() => touch(`traveler-${index}-firstName`)}
                    error={
                      touched[`traveler-${index}-firstName`] && !traveler.firstName.trim()
                        ? "First name is required."
                        : undefined
                    }
                    name={`traveler-${index}-firstName`}
                    autoComplete={`section-traveler-${index} given-name`}
                    required
                  />
                  <TextField
                    label="Last name"
                    value={traveler.lastName}
                    onChange={(v) => updateTraveler(index, { lastName: v })}
                    onBlur={() => touch(`traveler-${index}-lastName`)}
                    error={
                      touched[`traveler-${index}-lastName`] && !traveler.lastName.trim()
                        ? "Last name is required."
                        : undefined
                    }
                    name={`traveler-${index}-lastName`}
                    autoComplete={`section-traveler-${index} family-name`}
                    required
                  />
                  <TextField
                    label="Date of birth"
                    type="date"
                    max={todayIso}
                    value={traveler.dob}
                    onChange={(v) => updateTraveler(index, { dob: v })}
                    onBlur={() => touch(`traveler-${index}-dob`)}
                    error={
                      touched[`traveler-${index}-dob`] && traveler.dob > todayIso
                        ? "Date of birth can't be in the future."
                        : undefined
                    }
                    name={`traveler-${index}-dob`}
                    autoComplete={`section-traveler-${index} bday`}
                  />
                  <TextField
                    label="Passport number"
                    value={traveler.passport}
                    onChange={(v) => updateTraveler(index, { passport: v })}
                    name={`traveler-${index}-passport`}
                    autoComplete="off"
                  />
                  {(traveler.occupancy === "double" || traveler.occupancy === "triple") && (
                    <TextField
                      label="Rooming with"
                      value={traveler.roomWith}
                      onChange={(v) => updateTraveler(index, { roomWith: v })}
                      name={`traveler-${index}-roomWith`}
                    />
                  )}
                  <TextField
                    label="Dietary needs"
                    value={traveler.dietary}
                    onChange={(v) => updateTraveler(index, { dietary: v })}
                    name={`traveler-${index}-dietary`}
                  />
                  <PassportUploadField
                    value={traveler.passportScanUrl}
                    fileName={traveler.passportScanFileName}
                    onUploaded={(url, fileName) =>
                      updateTraveler(index, { passportScanUrl: url, passportScanFileName: fileName })
                    }
                    onRemove={() => updateTraveler(index, { passportScanUrl: "", passportScanFileName: "" })}
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
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-mist)]">
              Contact information
            </h2>
            <TextField
              label="Your name"
              value={contactName}
              onChange={setContactName}
              onBlur={() => touch("contactName")}
              error={touched.contactName && !contactName.trim() ? "Name is required." : undefined}
              name="contactName"
              autoComplete="name"
              required
            />
            <TextField
              label="Email"
              type="email"
              value={contactEmail}
              onChange={setContactEmail}
              onBlur={() => touch("contactEmail")}
              error={
                touched.contactEmail && !EMAIL_PATTERN.test(contactEmail.trim())
                  ? "Enter a valid email."
                  : undefined
              }
              name="contactEmail"
              autoComplete="email"
              required
            />
            <TextField
              label="Phone"
              type="tel"
              value={contactPhone}
              onChange={setContactPhone}
              name="contactPhone"
              autoComplete="tel"
            />
            <StepNav
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
              nextDisabled={!contactName.trim() || !EMAIL_PATTERN.test(contactEmail.trim())}
            />
          </div>
        )}

        {step === 5 && departure && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-mist)]">
              Review &amp; submit
            </h2>

            <dl className="grid gap-3 rounded-xl border border-[var(--color-border-ice)] bg-[var(--color-surface)] p-5 text-[15px]">
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
              <Row
                label="Balance due"
                value={`${formatUsd(priceBreakdown.grandTotal - paymentAmount)} — ${tour.pricing.balanceDueDaysBeforeDeparture} days before departure`}
              />
            </dl>

            {isGuaranteed && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-4 py-3 text-sm font-medium text-[var(--color-success)]">
                <span aria-hidden="true">✓</span>
                This departure is guaranteed to run — full payment of{" "}
                {formatUsd(priceBreakdown.grandTotal)} is required to reserve your spot.
              </div>
            )}

            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-semibold text-[var(--color-mist)]">
                How would you like to complete payment?
              </legend>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-[15px] transition-all ${
                  contactPreference === "callback" ? SELECTED_OPTION : IDLE_OPTION
                }`}
              >
                <input
                  type="radio"
                  className="mt-1 accent-[var(--color-ice)]"
                  checked={contactPreference === "callback"}
                  onChange={() => setContactPreference("callback")}
                />
                <span>
                  <span className="block font-semibold text-[var(--color-mist)]">
                    A representative will call me
                  </span>
                  <span className="text-[var(--color-slate)]">
                    We&apos;ll reach out within one business day to arrange payment.
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
                  className="mt-1 accent-[var(--color-ice)]"
                  checked={contactPreference === "pay_online"}
                  onChange={() => setContactPreference("pay_online")}
                />
                <span>
                  <span className="block font-semibold text-[var(--color-mist)]">
                    I&apos;d like to pay online
                  </span>
                  <span className="text-[var(--color-slate)]">
                    Pay securely by card right after you submit.
                  </span>
                </span>
              </label>
            </fieldset>

            {!isGuaranteed && contactPreference === "pay_online" && (
              <div className="rounded-xl border border-[var(--color-border-ice)] bg-[var(--color-field-bg)] p-4">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="paymentAmount" className="text-sm font-semibold text-[var(--color-mist)]">
                    How much would you like to pay now?
                  </label>
                  <span className="text-lg font-bold text-[var(--color-ice)]">{formatUsd(paymentAmount)}</span>
                </div>
                <input
                  id="paymentAmount"
                  type="range"
                  min={depositAmount}
                  max={priceBreakdown.grandTotal}
                  step={50}
                  value={paymentAmount}
                  onChange={(e) => setCustomPaymentAmount(Number(e.target.value))}
                  className="mt-3 w-full accent-[var(--color-ice)]"
                />
                <div className="mt-1 flex justify-between text-xs text-[var(--color-slate)]">
                  <span>Deposit {formatUsd(depositAmount)}</span>
                  <span>Full price {formatUsd(priceBreakdown.grandTotal)}</span>
                </div>
                {errors.paymentAmount && (
                  <p className="mt-2 text-xs text-[var(--color-danger-text)]">{errors.paymentAmount[0]}</p>
                )}
              </div>
            )}

            <div className="rounded-xl border border-[var(--color-border-ice)] bg-[var(--color-field-bg)] p-4 text-sm text-[var(--color-slate)]">
              <p className="mb-2 font-semibold text-[var(--color-mist)]">Cancellation policy</p>
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

            {Object.values(errors).flat().filter(Boolean).length > 0 && (
              <div className="rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger-text)]">
                {Object.values(errors)
                  .flat()
                  .filter(Boolean)
                  .map((message) => (
                    <p key={message}>{message}</p>
                  ))}
              </div>
            )}

            <div className="flex flex-col-reverse items-stretch gap-4 border-t border-[var(--color-border-hairline)] pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-sm font-semibold text-[var(--color-slate)] transition hover:text-[var(--color-ice)]"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full rounded-full bg-[var(--color-ice)] px-8 py-3.5 text-sm font-bold text-[var(--color-ice-ink)] shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-60 sm:w-auto"
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
    ? "Thank you! We couldn't start online payment just now, but your registration is saved — a member of our team will follow up shortly to collect payment."
    : contactPreference === "callback"
      ? "Thank you! A member of our team will call you within one business day to confirm details and arrange payment."
      : "Thank you! Your payment has been received and your spot is confirmed.";

  return (
    <div className="glass-panel-elevated rounded-3xl p-8 text-center shadow-2xl sm:p-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-ice)]/40 bg-[var(--color-ice)]/20 text-4xl text-[var(--color-ice)]">
        ✓
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-ice)]">
        Registration received
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold text-[var(--color-mist)] sm:text-3xl">
        We look forward to welcoming you
      </h2>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-[var(--color-slate)]">{message}</p>
      <a
        href="tel:18008470700"
        className="mt-8 inline-block text-sm font-bold text-[var(--color-ice)] transition hover:brightness-110"
      >
        Questions? Call 1-800-847-0700
      </a>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="grid grid-cols-5 gap-1 border-b border-[var(--color-border-hairline-faint)] bg-[var(--color-glacier)]/80 px-4 py-4 text-center text-xs sm:gap-0 sm:px-6">
      {STEP_LABELS.map((label, index) => {
        const active = index + 1 <= step;
        const current = index + 1 === step;
        return (
          <li
            key={label}
            className={`flex items-center justify-center gap-2 ${
              active ? "font-bold text-[var(--color-ice)]" : "text-[var(--color-slate)]/50"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                current
                  ? "bg-[var(--color-ice)] text-[var(--color-ice-ink)]"
                  : active
                    ? "bg-[var(--color-ice)]/20 text-[var(--color-ice)]"
                    : "bg-[var(--color-surface-hover-b)] text-[var(--color-slate)]/50"
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
    <div className="flex flex-col-reverse items-stretch gap-4 border-t border-[var(--color-border-hairline)] pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-[var(--color-slate)] transition hover:text-[var(--color-ice)]"
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
        className="w-full rounded-full bg-[var(--color-ice)] px-8 py-3.5 text-sm font-bold text-[var(--color-ice-ink)] shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-40 sm:w-auto"
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
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-[var(--color-slate)]">{label}</dt>
      <dd className={`font-semibold ${accent ? "text-[var(--color-ice)]" : "text-[var(--color-mist)]"} sm:text-right`}>
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
      <label className="mb-1.5 block min-h-[2.5rem] text-xs font-bold uppercase tracking-widest text-[var(--color-slate)]">
        <span className="block">{label}</span>
        <span className="block font-normal normal-case tracking-normal opacity-80">
          {hint ? `(${hint})` : " "}
        </span>
      </label>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          const next = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
          // React's controlled-input sync for type="number" compares with
          // loose equality ("01" != 1 is false), so it silently skips
          // rewriting the DOM and a leading zero sticks around — normalize
          // the raw input value here so the field never shows "01".
          e.target.value = String(next);
          onChange(next);
        }}
        className="glacier-field mt-auto w-full"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  name,
  autoComplete,
  required = false,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Typically used to mark the field "touched" so `error` only shows after the visitor leaves it. */
  onBlur?: () => void;
  error?: string;
  type?: string;
  /** Also used as the field's `id`, so the label is properly associated with it. */
  name?: string;
  autoComplete?: string;
  required?: boolean;
  /** For type="date" — bounds the native picker (e.g. no future date of birth). */
  min?: string;
  max?: string;
}) {
  const id = useId();
  const fieldId = name ?? id;

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[var(--color-slate)]"
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={fieldId}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        required={required}
        min={min}
        max={max}
        aria-invalid={!!error}
        className="glacier-field w-full"
      />
      {error && <p className="mt-1 text-xs text-[var(--color-danger-text)]">{error}</p>}
    </div>
  );
}

function PassportUploadField({
  value,
  fileName,
  onUploaded,
  onRemove,
}: {
  value: string;
  fileName: string;
  onUploaded: (url: string, fileName: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadPassportScan(formData);
    if (result.ok) {
      onUploaded(result.url, file.name);
    } else {
      setError(result.error);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="sm:col-span-2">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[var(--color-slate)]">
        Passport scan{" "}
        <span className="font-normal normal-case tracking-normal opacity-70">(optional)</span>
      </label>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border-ice)] bg-[var(--color-field-bg)] px-3.5 py-2.5">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-medium text-[var(--color-ice)] hover:underline"
          >
            {fileName || "View uploaded file"}
          </a>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-xs font-semibold text-[var(--color-slate)] transition hover:text-[var(--color-danger-text)]"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border-ice-strong)] bg-[var(--color-field-bg)] px-3.5 py-3 text-sm font-medium text-[var(--color-slate)] transition-colors hover:border-[var(--color-ice)] hover:text-[var(--color-mist)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
          {uploading ? "Uploading…" : "Upload photo or PDF"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={uploading}
            onChange={handleChange}
            className="hidden"
          />
        </label>
      )}
      {error && <p className="mt-1 text-xs font-medium text-[var(--color-danger-text)]">{error}</p>}
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
        <span className="rounded-full bg-[var(--color-lilac)]/20 px-2 py-0.5 text-[var(--color-lilac)]">
          Last spots
        </span>
        <span className="text-[var(--color-slate)]">{seats} spots left</span>
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-slate)]">
      Plenty of spots available
    </span>
  );
}

/** Per-departure trust badge, shown inline in the date list — each departure carries its own assurance. */
function AssuranceBadge({ assurance }: { assurance: "conditional" | "guaranteed" }) {
  if (assurance === "guaranteed") {
    return (
      <span className="ml-7 inline-flex w-fit items-center gap-1 rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-success)]">
        <span aria-hidden="true">✓</span> Guaranteed to run
      </span>
    );
  }
  return (
    <span className="ml-7 inline-flex w-fit items-center rounded-full bg-[var(--color-surface-hover-b)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-slate)]">
      Subject to registration
    </span>
  );
}
