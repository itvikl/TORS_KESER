/**
 * Shared types mirroring the Firestore data model (PRD section 8).
 * These are the single source of truth for shapes used across
 * server components, Server Actions, and the admin editor's live preview
 * (see components/marketing/TourPageView.tsx).
 */

export type TravelStyle = "land" | "luxury" | "cruise" | "seminar";
export type TourStatus = "draft" | "published" | "archived";
/**
 * Admin-set editorial trust badge shown to customers on the booking page.
 * Deliberately independent of the real minGroupSize/minGroupSizeMet data
 * (which stays internal-only) — the admin sets this by judgment, not an
 * automatic computation.
 */
export type BookingAssurance = "conditional" | "guaranteed";
export type DepartureStatus = "open" | "closed" | "soldout" | "cancelled";
export type Occupancy = "double" | "single" | "triple" | "child";
export type BookingStatus =
  | "pending_payment"
  | "partial_paid"
  | "paid_in_full"
  | "cancelled"
  | "refunded";
export type PaymentType = "deposit" | "balance" | "full" | "refund";
export type LeadSource = "contact" | "custom" | "evergreen" | "manual";
export type UserRole = "customer" | "staff" | "admin";
export type StaffRole = "guide" | "kashrutSupervisor";

export interface KashrutDetails {
  supervisionLevel: string; // e.g. "Local Orthodox Rabbinate + company mashgiach"
  patYisrael: boolean | "not_guaranteed";
  chalavYisrael: boolean | "not_guaranteed";
  notes?: string;
}

export interface TourPricing {
  pricePerPersonDouble: number;
  /** Flat per-person price for a private (single-occupancy) room — not an add-on over the double rate. */
  pricePerPersonSingle: number;
  pricePerPersonTriple?: number;
  childPrice?: number;
  depositAmountPerPerson: number;
  balanceDueDaysBeforeDeparture: number;
}

export interface ItineraryDay {
  dayId: string;
  dayNumber: number;
  title: string;
  description: string;
  meals: string[];
  accommodation?: string;
  attractions?: string[];
  images?: string[];
}

export interface Tour {
  tourId: string;
  slug: string;
  slugHistory?: string[];
  title: string;
  summary: string;
  description: string;
  heroImage: string;
  gallery: string[];
  countries: string[];
  travelStyle: TravelStyle;
  themeTags: string[];
  durationDays: number;
  minGroupSize: number;
  flightsIncluded: boolean;
  isSpecialOffer?: boolean;
  inclusions: string[];
  exclusions: string[];
  pricing: TourPricing;
  kashrutDetails: KashrutDetails;
  itineraryDays: ItineraryDay[];
  status: TourStatus;
  seoTitle?: string;
  seoDescription?: string;
  /** Display order in the admin list and the public homepage grid, set via drag-and-drop. */
  sortOrder?: number;
  /** Set only by scripts/migrate-legacy-tours.ts — distinguishes scraped-from-old-site tours (pricing/dates not yet verified) from hand-curated ones, so staff know which need review before ever publishing. */
  isLegacyMigrated?: boolean;
}

export interface Departure {
  departureId: string;
  tourId: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  pricingOverride?: Partial<TourPricing>;
  capacityTotal: number;
  capacityBooked: number;
  capacityHeld: number;
  minGroupSizeMet: boolean;
  guideId?: string;
  kashrutSupervisorId?: string;
  balanceDueDate: string; // ISO date, derived from startDate - balanceDueDaysBeforeDeparture
  status: DepartureStatus;
  /** Customer-facing trust badge; missing/undefined is treated as "conditional". */
  bookingAssurance?: BookingAssurance;
}

export function availableSeats(departure: Departure): number {
  return (
    departure.capacityTotal - departure.capacityBooked - departure.capacityHeld
  );
}

export interface Staff {
  staffId: string;
  name: string;
  role: StaffRole;
  bio?: string;
  photo?: string;
}

export interface Review {
  reviewId: string;
  tourId: string;
  customerName: string;
  rating: number; // 1-5
  photo?: string;
  body: string;
  status: "pending" | "approved" | "rejected";
}

export interface PriceBreakdown {
  baseTotal: number;
  childAdjustments: number;
  grandTotal: number;
}

export interface RoomConfiguration {
  doubleRooms: number;
  singleRooms: number;
  triples: number;
}

export interface Traveler {
  travelerId: string;
  firstName: string;
  lastName: string;
  dob?: string;
  passport?: string;
  passportScanUrl?: string;
  occupancy: Occupancy;
  roomWith?: string;
  dietary?: string;
}

/** How the customer wants to complete payment (chosen at the end of the registration form). */
export type ContactPreference = "callback" | "pay_online";

export interface Booking {
  bookingId: string;
  /** Optional — there's no customer account system yet, so most bookings are guest submissions. */
  userId?: string;
  departureId: string;
  tourId: string;
  travelerCount: number;
  roomConfiguration: RoomConfiguration;
  priceBreakdown: PriceBreakdown;
  /** The tour's deposit floor at booking time — a minimum, not necessarily what was paid (see initialPaymentAmount). */
  depositAmount: number;
  /** What the customer actually chose/was charged for the first payment — between depositAmount and priceBreakdown.grandTotal, or exactly grandTotal on a guaranteed departure. */
  initialPaymentAmount: number;
  balanceAmount: number;
  amountPaid: number;
  status: BookingStatus;
  /** Random token gating /pay/[bookingId] — generated at creation, not a login/session credential. */
  paymentLinkToken: string;
  contactPreference: ContactPreference;
  paymentProvider?: "stripe";
  paymentIntentId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  /** Set once staff open this departure's registrant list — undefined means the booking hasn't been seen yet. */
  viewedAt?: string;
}

export interface Payment {
  paymentId: string;
  bookingId: string;
  amount: number;
  type: PaymentType;
  providerRef?: string;
  createdAt: string;
}

export interface Lead {
  leadId: string;
  tourId?: string;
  /** Not every intake form collects all contact fields (e.g. the custom-tour form only takes a phone number). */
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  message?: string;
  destination?: string;
  groupSize?: number;
  source: LeadSource;
  status: "new" | "contacted" | "converted" | "closed";
  createdAt: string;
}

export interface BlogPost {
  postId: string;
  slug: string;
  title: string;
  body: string;
  heroImage?: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface SpecialOffer {
  offerId: string;
  title: string;
  body: string;
  image?: string;
  tourId?: string;
  validUntil?: string;
  status: "draft" | "published";
}

export interface SeoLandingPage {
  pageId: string;
  slug: string;
  title: string;
  body: string;
  tourIds: string[];
  seoTitle?: string;
  seoDescription?: string;
  status: "draft" | "published";
}

export interface SiteSettings {
  phone: string;
  phoneAlt?: string;
  email?: string;
  defaultDepositAmount: number;
  defaultMinGroupSize: number;
  defaultBalanceDueDays: number;
  defaultCompanyCancelDeadlineDays: number;
  /** At or below this remaining-seats count, customers see the exact number + a "last spots" badge; above it, only a vague "plenty available" message. */
  lowSeatsThreshold: number;
}

/**
 * Admin-editable copy for the public marketing pages (the "Site Content"
 * admin tab) — one document per page key, stored in the `siteContent`
 * collection. Kept separate from Tour/BlogPost/etc. content types since
 * these back fixed page layouts rather than a list+CRUD collection.
 */
export type SiteContentPageKey =
  | "home"
  | "about"
  | "custom-tours"
  | "special-offers"
  | "testimonials"
  | "faq"
  | "contact"
  | "legal-privacy"
  | "legal-terms";

export interface SiteContentTrustSignal {
  title: string;
  body: string;
}

export interface SiteContentHome {
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  trustSignals: [SiteContentTrustSignal, SiteContentTrustSignal, SiteContentTrustSignal];
  ctaHeading: string;
  ctaHeadingHighlight: string;
  ctaBody: string;
  ctaPrimaryButton: string;
  ctaSecondaryButton: string;
}

export interface SiteContentSection {
  sectionId: string;
  heading: string;
  body: string;
}

export interface SiteContentAbout {
  eyebrow: string;
  title: string;
  lede: string;
  sections: SiteContentSection[];
}

/** Shared shape for pages whose only editable copy is the top PageHeader. */
export interface SiteContentSimplePage {
  eyebrow?: string;
  title: string;
  lede?: string;
}

export interface SiteContentFaqItem {
  itemId: string;
  question: string;
  answer: string;
}

export interface SiteContentFaq {
  title: string;
  lede?: string;
  items: SiteContentFaqItem[];
}

/** Contact page's own copy only — the phone numbers it displays come from SiteSettings, not duplicated here. */
export interface SiteContentContact {
  title: string;
  lede: string;
}

export interface SiteContentLegal {
  title: string;
  body: string;
}
