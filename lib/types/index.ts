/**
 * Shared types mirroring the Firestore data model (PRD section 8).
 * These are the single source of truth for shapes used across
 * server components, Server Actions, and the admin editor's live preview
 * (see components/marketing/TourPageView.tsx).
 */

export type TravelStyle = "land" | "luxury" | "cruise" | "seminar";
export type TourStatus = "draft" | "published" | "archived";
export type DepartureStatus = "open" | "closed" | "soldout" | "cancelled";
export type Occupancy = "double" | "single" | "triple" | "child";
export type BookingStatus =
  | "pending_payment"
  | "deposit_paid"
  | "paid_in_full"
  | "cancelled"
  | "refunded";
export type PaymentType = "deposit" | "balance" | "full" | "refund";
export type LeadSource = "contact" | "custom" | "evergreen";
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
  singleSupplement: number;
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
  region: string;
  travelStyle: TravelStyle;
  themeTags: string[];
  durationDays: number;
  minGroupSize: number;
  flightsIncluded: boolean;
  inclusions: string[];
  exclusions: string[];
  pricing: TourPricing;
  kashrutDetails: KashrutDetails;
  itineraryDays: ItineraryDay[];
  status: TourStatus;
  seoTitle?: string;
  seoDescription?: string;
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
  singleSupplementsTotal: number;
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
  occupancy: Occupancy;
  roomWith?: string;
  dietary?: string;
}

export interface Booking {
  bookingId: string;
  userId: string;
  departureId: string;
  tourId: string;
  travelerCount: number;
  roomConfiguration: RoomConfiguration;
  priceBreakdown: PriceBreakdown;
  depositAmount: number;
  balanceAmount: number;
  amountPaid: number;
  status: BookingStatus;
  paymentProvider?: "stripe";
  paymentIntentId?: string;
  contactEmail: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
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
  name: string;
  email: string;
  phone?: string;
  message?: string;
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

export interface SiteSettings {
  phone: string;
  phoneAlt?: string;
  email?: string;
  defaultDepositAmount: number;
  defaultMinGroupSize: number;
  defaultBalanceDueDays: number;
  defaultCompanyCancelDeadlineDays: number;
}
