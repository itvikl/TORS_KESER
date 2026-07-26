/**
 * Single source of truth for cancellation charge calculations.
 * Used both to DISPLAY the policy to a customer before they book, and to
 * compute the actual refund when an admin processes a cancellation —
 * so the two can never drift apart (PRD FR-20).
 *
 * Tiers mirror the live site's existing policy (working days before
 * departure, i.e. excluding Fridays, Saturdays, and holidays):
 *   45–60 working days before: 30% charge
 *   21–44 working days before: 50% charge
 *   7–20 working days before:  75% charge
 *   <7 working days before:    100% charge
 * Anytime after registration, a flat admin fee also applies.
 */

export interface CancellationTier {
  /** Charge applies when working days before departure is >= this value. */
  minWorkingDaysBefore: number;
  chargePercent: number;
}

export const DEFAULT_CANCELLATION_TIERS: CancellationTier[] = [
  { minWorkingDaysBefore: 45, chargePercent: 30 },
  { minWorkingDaysBefore: 21, chargePercent: 50 },
  { minWorkingDaysBefore: 7, chargePercent: 75 },
  { minWorkingDaysBefore: 0, chargePercent: 100 },
];

export const DEFAULT_ADMIN_FEE = 47;

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday, Saturday
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Counts working days between two dates, excluding Fri/Sat and the given holidays. */
export function workingDaysBetween(
  from: Date,
  to: Date,
  holidays: Date[] = []
): number {
  if (to <= from) return 0;
  let count = 0;
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    if (isWeekend(cursor)) continue;
    if (holidays.some((h) => isSameDay(h, cursor))) continue;
    count++;
  }
  return count;
}

export interface CancellationQuote {
  workingDaysBeforeDeparture: number;
  chargePercent: number;
  adminFee: number;
}

/**
 * Computes the cancellation charge for cancelling `cancellationDate`
 * against a departure on `departureDate`.
 */
export function quoteCancellation(
  departureDate: Date,
  cancellationDate: Date,
  options: {
    tiers?: CancellationTier[];
    holidays?: Date[];
    adminFee?: number;
  } = {}
): CancellationQuote {
  const tiers = options.tiers ?? DEFAULT_CANCELLATION_TIERS;
  const holidays = options.holidays ?? [];
  const adminFee = options.adminFee ?? DEFAULT_ADMIN_FEE;

  const workingDaysBeforeDeparture = workingDaysBetween(
    cancellationDate,
    departureDate,
    holidays
  );

  // Tiers are sorted descending by threshold; pick the first tier whose
  // threshold the remaining working days still satisfy.
  const sorted = [...tiers].sort(
    (a, b) => b.minWorkingDaysBefore - a.minWorkingDaysBefore
  );
  const tier =
    sorted.find((t) => workingDaysBeforeDeparture >= t.minWorkingDaysBefore) ??
    sorted[sorted.length - 1];

  return {
    workingDaysBeforeDeparture,
    chargePercent: tier.chargePercent,
    adminFee,
  };
}

/** Refund amount owed to the customer for a given paid amount. */
export function refundAmount(
  amountPaid: number,
  quote: CancellationQuote
): number {
  const charge = (amountPaid * quote.chargePercent) / 100 + quote.adminFee;
  return Math.max(0, Math.round((amountPaid - charge) * 100) / 100);
}

/** Computes a departure's balance due date from its start date. */
export function computeBalanceDueDate(
  startDate: Date,
  balanceDueDaysBeforeDeparture: number
): Date {
  const due = new Date(startDate);
  due.setDate(due.getDate() - balanceDueDaysBeforeDeparture);
  return due;
}
