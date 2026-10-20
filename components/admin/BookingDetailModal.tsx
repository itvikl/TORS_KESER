"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBookingTravelers } from "@/lib/actions/bookings";
import { createAdminPaymentIntent } from "@/lib/actions/payments";
import DepositPaymentForm from "@/components/marketing/DepositPaymentForm";
import { formatUsd } from "@/lib/pricing";
import type { AdminBookingRow } from "@/lib/data/admin/bookings";
import type { Booking, BookingStatus, RoomConfiguration, Traveler } from "@/lib/types";
import { passportScanHref, passportScanPathOf } from "@/lib/passportScans";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending_payment: "bg-gold/15 text-terracotta-dark",
  partial_paid: "bg-olive/15 text-olive",
  paid_in_full: "bg-olive/25 text-olive",
  cancelled: "bg-ink-muted/15 text-ink-muted",
  refunded: "bg-ink-muted/15 text-ink-muted",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: "Pending payment",
  partial_paid: "Partially paid",
  paid_in_full: "Paid in full",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function formatDateRange(startIso: string, endIso: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
  return `${new Date(startIso).toLocaleDateString("en-US", opts)} – ${new Date(endIso).toLocaleDateString("en-US", opts)}`;
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

function roomConfigParts(room: RoomConfiguration): { label: string; count: number }[] {
  return [
    { label: "Double", count: room.doubleRooms },
    { label: "Single", count: room.singleRooms },
    { label: "Triple", count: room.triples },
  ].filter((part) => part.count > 0);
}

/** Opened by clicking a row in components/admin/BookingsTable.tsx — every field the customer entered, including travelers (fetched lazily since they live in a subcollection). */
export default function BookingDetailModal({
  row,
  onClose,
}: {
  row: AdminBookingRow;
  onClose: () => void;
}) {
  const { booking, tour, departure } = row;
  const [travelers, setTravelers] = useState<Traveler[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBookingTravelers(booking.bookingId).then((result) => {
      if (cancelled) return;
      if (result.ok) setTravelers(result.travelers);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [booking.bookingId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const rooms = roomConfigParts(booking.roomConfiguration);
  const priceBreakdown = booking.priceBreakdown;
  const balanceTone =
    booking.status === "cancelled" || booking.status === "refunded"
      ? "text-ink-muted"
      : booking.balanceAmount > 0
        ? "text-terracotta-dark"
        : "text-olive";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-line bg-sand-warm/50 px-6 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy/10 text-base font-bold text-navy">
            {getInitials(booking.contactName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 dir="auto" className="truncate text-lg font-bold text-ink">
                {booking.contactName}
              </h2>
              <span
                className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[booking.status]}`}
              >
                {STATUS_LABELS[booking.status]}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-ink-muted">
              {tour?.title ?? "—"} · {booking.travelerCount} traveler
              {booking.travelerCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-white hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Quick facts */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b border-line px-6 py-3 text-sm text-ink-muted">
          <span>{booking.contactEmail}</span>
          {booking.contactPhone && <span>{booking.contactPhone}</span>}
          <span>
            {booking.contactPreference === "pay_online" ? "Wants to pay online" : "Wants a callback"}
          </span>
          <span>
            Submitted{" "}
            {new Date(booking.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
          <Card title="Trip">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  {departure ? formatDateRange(departure.startDate, departure.endDate) : "No departure on file"}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Last updated {new Date(booking.updatedAt).toLocaleString("en-US")}
                </p>
              </div>
              {rooms.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rooms.map((room) => (
                    <span
                      key={room.label}
                      className="inline-flex items-center rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink"
                    >
                      {room.count} × {room.label} room{room.count > 1 ? "s" : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card title="Payment">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink-muted">Total price</span>
              <span className="text-2xl font-bold text-ink">{formatUsd(priceBreakdown.grandTotal)}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <StatTile label="Minimum" value={formatUsd(booking.depositAmount)} />
              <StatTile label="Paid so far" value={formatUsd(booking.amountPaid)} tone="text-olive" />
              <StatTile label="Balance due" value={formatUsd(booking.balanceAmount)} tone={balanceTone} />
            </div>

            {priceBreakdown.childAdjustments > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-ink-muted">
                <span>Base {formatUsd(priceBreakdown.baseTotal)}</span>
                <span>Child adjustments {formatUsd(priceBreakdown.childAdjustments)}</span>
              </div>
            )}
          </Card>

          {booking.balanceAmount > 0 &&
            booking.status !== "cancelled" &&
            booking.status !== "refunded" && <AdminChargeCard booking={booking} />}

          <Card title={`Travelers (${booking.travelerCount})`}>
            {error ? (
              <p className="text-sm text-terracotta-dark">{error}</p>
            ) : travelers === null ? (
              <p className="text-sm text-ink-muted">Loading…</p>
            ) : travelers.length === 0 ? (
              <p className="text-sm text-ink-muted">No traveler records found.</p>
            ) : (
              <div className="space-y-2">
                {travelers.map((traveler) => (
                  <div key={traveler.travelerId} className="rounded-lg border border-line bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p dir="auto" className="font-medium text-ink">
                        {traveler.firstName} {traveler.lastName}
                      </p>
                      <span className="shrink-0 rounded-full bg-navy/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-navy">
                        {traveler.occupancy}
                      </span>
                    </div>
                    {(traveler.dob || traveler.passport || traveler.roomWith || traveler.dietary) && (
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {traveler.dob && <TravelerField label="DOB" value={traveler.dob} />}
                        {traveler.passport && <TravelerField label="Passport" value={traveler.passport} />}
                        {traveler.roomWith && (
                          <TravelerField label="Rooming with" value={traveler.roomWith} />
                        )}
                        {traveler.dietary && <TravelerField label="Dietary" value={traveler.dietary} />}
                      </div>
                    )}
                    {passportScanPathOf(traveler) && (
                      <a
                        href={passportScanHref(passportScanPathOf(traveler)!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
                      >
                        View passport scan →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Lets staff key in the customer's card (e.g. after a callback request). Card data goes straight to Stripe Elements — never touches our server. */
function AdminChargeCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amountInput, setAmountInput] = useState(String(booking.balanceAmount));
  const [session, setSession] = useState<{ clientSecret: string; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [done, setDone] = useState(false);

  async function start() {
    setStarting(true);
    setError(null);
    const result = await createAdminPaymentIntent(booking.bookingId, Number(amountInput));
    setStarting(false);
    if (result.ok) setSession({ clientSecret: result.clientSecret, amount: result.amount });
    else setError(result.error);
  }

  function handleSuccess() {
    setDone(true);
    setSession(null);
    // The webhook records the payment asynchronously — give it a moment, then refresh the figures.
    setTimeout(() => router.refresh(), 2500);
  }

  if (done) {
    return (
      <Card title="Charge customer">
        <p className="text-sm font-medium text-olive">
          Payment submitted. The booking will update in a moment.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Charge customer">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Enter card details &amp; pay for customer
        </button>
      ) : session ? (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            Charging {formatUsd(session.amount)} to {booking.contactName}&apos;s card.
          </p>
          <DepositPaymentForm
            clientSecret={session.clientSecret}
            amount={session.amount}
            onSuccess={handleSuccess}
            forceLight
          />
          <button
            type="button"
            onClick={() => setSession(null)}
            className="text-xs font-semibold text-ink-muted hover:underline"
          >
            ← Change amount
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm text-ink-muted">
            Amount to charge (USD, up to {formatUsd(booking.balanceAmount)})
            <input
              type="number"
              min={1}
              max={booking.balanceAmount}
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
            />
          </label>
          {error && <p className="text-sm text-terracotta-dark">{error}</p>}
          <button
            type="button"
            disabled={starting}
            onClick={start}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {starting ? "Starting…" : "Continue to card details"}
          </button>
        </div>
      )}
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-sand-warm/25 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h3>
      {children}
    </section>
  );
}

function StatTile({ label, value, tone = "text-ink" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-2.5 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function TravelerField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-ink-muted">{label}: </span>
      <span dir="auto" className="text-ink">
        {value}
      </span>
    </div>
  );
}
