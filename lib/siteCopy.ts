/**
 * Admin-editable wording for the fixed text around dynamic data: the tour
 * page, the booking flow, and the blog and testimonials pages. Tour content
 * itself (itinerary, prices, dates) stays on the tour document.
 *
 * Free of "server-only" because BookingForm and the tour preview import it
 * from the client. Every default is the copy that was hardcoded before this
 * editor existed, so the site renders the same until someone saves a change.
 */

export interface CopyField {
  key: string;
  label: string;
  multiline?: boolean;
  /** May be saved blank. Everything else is required. */
  optional?: boolean;
  /** Values filled in at render time, written as {name} in the text. */
  placeholders?: string[];
}

export interface CopySection {
  title: string;
  description?: string;
  fields: CopyField[];
}

/** Replaces each {name} with its value; unknown names are left as written. */
export function fillCopy(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match
  );
}

export function placeholdersIn(text: string): string[] {
  return Array.from(text.matchAll(/\{(\w+)\}/g), (match) => match[1]);
}

export const TOUR_PAGE_COPY_DEFAULTS = {
  navOverview: "Overview",
  navItinerary: "Itinerary",
  navGuides: "Your Guides",
  navIncluded: "What's Included",
  navTestimonials: "Testimonials",
  navCancellation: "Cancellation Policy",
  navDates: "Dates & Booking",

  heroDays: "{days} days",
  heroMorePhotos: "+{count} Photos",

  overviewHeading: "Overview",
  durationLabel: "Duration",
  durationValue: "{days} Days / {nights} Nights",
  groupSizeLabel: "Group Size",
  groupSizeValue: "From {count} travelers",
  groupSizeFallback: "Small groups",
  countriesLabel: "Countries",

  itineraryHeading: "Your Journey Day by Day",
  attractionsLabel: "Attractions:",
  mealsLabel: "Meals:",

  guidesHeading: "Your Guides",
  guideLeadingLabel: "Leading",

  kashrutDefaultTitle: "Kashrut",
  supervisionLabel: "Supervision",
  patYisraelLabel: "Pat Yisrael",
  chalavYisraelLabel: "Chalav Yisrael",
  kashrutGuaranteed: "Guaranteed",
  kashrutNotGuaranteed: "Not guaranteed at every destination",
  kashrutNotOffered: "Not offered",

  importantToKnowHeading: "Important to Know",
  includedHeading: "What's Included",
  notIncludedHeading: "Not Included",
  testimonialsHeading: "What Travelers Say",
  testimonialsLink: "All testimonials",
  cancellationHeading: "Cancellation Policy",

  priceLabel: "Starting from",
  perPersonLabel: "/ per person",
  priceNote: "Double occupancy · {singlePrice} / person for a private room",
  priceSupplement: "+{supplement}",
  flightsHighlight: "Flights included",
  kosherHighlight: "Fully kosher program",
  departuresHeading: "Departure Dates",
  noDatesMessage: "The next date for this tour will be published soon.",
  guideLabel: "Guide:",
  bookButton: "Book",
  callPrefix: "Call",
  depositNote:
    "Secure your spot with a {deposit} deposit per person. Balance due {days} days before departure.",

  statusSoldOut: "Sold Out",
  statusCancelled: "Cancelled",
  statusLowSeats: "Only {seats} spots left",
  statusAvailable: "Available",
};

export type TourPageCopy = typeof TOUR_PAGE_COPY_DEFAULTS;

/** The availability wording shared by the tour page and the booking form's date step. */
export type DepartureStatusCopy = Pick<
  TourPageCopy,
  "statusSoldOut" | "statusCancelled" | "statusLowSeats" | "statusAvailable"
>;

export const TOUR_PAGE_COPY_SECTIONS: CopySection[] = [
  {
    title: "Booking card",
    description: "The price and dates panel beside the tour. The amounts come from each tour's pricing.",
    fields: [
      { key: "priceLabel", label: "Above the price" },
      { key: "perPersonLabel", label: "After the price" },
      { key: "priceNote", label: "Note under the price", multiline: true, placeholders: ["singlePrice"] },
      { key: "priceSupplement", label: "Single supplement, after the note", optional: true, placeholders: ["supplement"] },
      { key: "flightsHighlight", label: "Highlight when flights are included", optional: true },
      { key: "kosherHighlight", label: "Kosher highlight", optional: true },
      { key: "departuresHeading", label: "Dates heading" },
      { key: "noDatesMessage", label: "Message when there are no dates", multiline: true },
      { key: "guideLabel", label: "Before the guide's name" },
      { key: "bookButton", label: "Book button" },
      { key: "callPrefix", label: "Before the phone number" },
      { key: "depositNote", label: "Deposit note", multiline: true, placeholders: ["deposit", "days"] },
    ],
  },
  {
    title: "Date availability",
    description: "Also shown on the first step of the booking form.",
    fields: [
      { key: "statusAvailable", label: "Available" },
      { key: "statusLowSeats", label: "Few seats left", placeholders: ["seats"] },
      { key: "statusSoldOut", label: "Sold out" },
      { key: "statusCancelled", label: "Cancelled" },
    ],
  },
  {
    title: "Section tabs",
    description: "The strip of links under the photos.",
    fields: [
      { key: "navOverview", label: "Overview" },
      { key: "navItinerary", label: "Itinerary" },
      { key: "navGuides", label: "Guides" },
      { key: "navIncluded", label: "What's included" },
      { key: "navTestimonials", label: "Testimonials" },
      { key: "navCancellation", label: "Cancellation" },
      { key: "navDates", label: "Dates (mobile only)" },
    ],
  },
  {
    title: "Photos and overview",
    fields: [
      { key: "heroDays", label: "Length, on the main photo", placeholders: ["days"] },
      { key: "heroMorePhotos", label: "More photos tile", placeholders: ["count"] },
      { key: "overviewHeading", label: "Overview heading" },
      { key: "durationLabel", label: "Duration label" },
      { key: "durationValue", label: "Duration value", placeholders: ["days", "nights"] },
      { key: "groupSizeLabel", label: "Group size label" },
      { key: "groupSizeValue", label: "Group size value", placeholders: ["count"] },
      { key: "groupSizeFallback", label: "Group size when no minimum is set" },
      { key: "countriesLabel", label: "Countries label" },
    ],
  },
  {
    title: "Itinerary and guides",
    fields: [
      { key: "itineraryHeading", label: "Itinerary heading" },
      { key: "attractionsLabel", label: "Attractions label" },
      { key: "mealsLabel", label: "Meals label" },
      { key: "guidesHeading", label: "Guides heading" },
      { key: "guideLeadingLabel", label: "Before a guide's dates" },
    ],
  },
  {
    title: "Kashrut",
    description: "A tour's own kashrut title, when set, replaces the default title.",
    fields: [
      { key: "kashrutDefaultTitle", label: "Default title" },
      { key: "supervisionLabel", label: "Supervision label" },
      { key: "patYisraelLabel", label: "Pat Yisrael label" },
      { key: "chalavYisraelLabel", label: "Chalav Yisrael label" },
      { key: "kashrutGuaranteed", label: "Status: guaranteed" },
      { key: "kashrutNotGuaranteed", label: "Status: not guaranteed" },
      { key: "kashrutNotOffered", label: "Status: not offered" },
    ],
  },
  {
    title: "Other headings",
    fields: [
      { key: "importantToKnowHeading", label: "Important to know" },
      { key: "includedHeading", label: "What's included" },
      { key: "notIncludedHeading", label: "Not included" },
      { key: "testimonialsHeading", label: "Testimonials" },
      { key: "testimonialsLink", label: "Link to all testimonials" },
      { key: "cancellationHeading", label: "Cancellation policy" },
    ],
  },
];

export const BOOKING_COPY_DEFAULTS = {
  headerEyebrow: "Register",
  headerLede: "Reserve your place — choose dates, party size, and traveler details below.",
  noDatesMessage:
    "The next date for this tour will be published soon. Call us at {phone} and we'll let you know the moment it's live.",
  noOpenDatesMessage:
    "There are no open departure dates for this tour right now. Call us at {phone} and we'll help you find the right trip.",

  stepDates: "Dates",
  stepParty: "Party size",
  stepTravelers: "Travelers",
  stepContact: "Contact",
  stepReview: "Review",
  continueButton: "Continue",
  backButton: "Back",

  datesHeading: "Choose a departure",
  assuranceGuaranteed: "Guaranteed to run",
  assuranceConditional: "Subject to registration",

  partyHeading: "Party size & rooms",
  doubleRooms: "Double rooms",
  doubleHint: "2 adults each",
  singleRooms: "Single rooms",
  singleHint: "1 adult each",
  singleHintSupplement: "1 adult each · +{supplement}",
  tripleRooms: "Triple rooms",
  tripleHint: "3 adults each",
  children: "Children",
  travelerSingular: "traveler",
  travelerPlural: "travelers",
  estimatedTotal: "Estimated total",
  guaranteedPartyNote: "This departure is guaranteed to run — full payment is required to reserve your spot.",
  depositNote: "Starting deposit: {deposit} — you'll choose how much to pay in the next step.",
  seatsWarning: "Only {seats} {spots} left on this date — reduce the party size or choose another date.",

  travelersHeading: "Traveler details",
  travelerCard: "Traveler {number}",
  firstName: "First name",
  lastName: "Last name",
  dateOfBirth: "Date of birth",
  passportNumber: "Passport number",
  roomingWith: "Rooming with",
  dietaryNeeds: "Dietary needs",
  passportScan: "Passport scan",
  passportScanOptional: "(optional)",
  uploadButton: "Upload photo or PDF",
  uploadingLabel: "Uploading…",
  passportUploaded: "Passport uploaded",
  removeButton: "Remove",
  secureUploadTitle: "Secure upload",
  secureUploadBody:
    "— encrypted in transit and at rest, stored privately with no public link. Only Keshertours staff can view it.",

  contactHeading: "Contact information",
  contactName: "Your name",
  contactEmail: "Email",
  contactPhone: "Phone",

  reviewHeading: "Review & submit",
  reviewDeparture: "Departure",
  reviewTravelers: "Travelers",
  reviewBalance: "Balance due",
  reviewBalanceValue: "{amount} — {days} days before departure",
  guaranteedReviewNote: "This departure is guaranteed to run — full payment of {total} is required to reserve your spot.",
  offlineTitle: "No payment is taken online",
  offlineBody: "Book now and a representative will call you within one business day to confirm the details and arrange payment.",
  paymentChoiceHeading: "How would you like to complete payment?",
  callbackTitle: "A representative will call me",
  callbackBody: "We'll reach out within one business day to arrange payment.",
  payOnlineTitle: "I'd like to pay online",
  payOnlineBody: "Pay securely by card right after you submit.",
  paymentAmountLabel: "How much would you like to pay now?",
  paymentMinLabel: "Deposit",
  paymentMaxLabel: "Full price",
  cancellationHeading: "Cancellation policy",
  cancellationTier: "{days}+ working days before departure: {percent}% charge",
  cancellationFee: "Plus a {fee} admin fee.",
  submitOnline: "Submit Registration",
  submitOffline: "Book — We'll Call You",
  submitting: "Submitting…",

  paymentHeading: "Complete your payment",
  paymentBody: "Your registration is saved. Complete your {amount} payment below to confirm your spot.",

  confirmationEyebrow: "Registration received",
  confirmationHeading: "We look forward to welcoming you",
  confirmationCallback: "Thank you! A member of our team will call you within one business day to confirm details and arrange payment.",
  confirmationPaid: "Thank you! Your payment has been received and your spot is confirmed.",
  confirmationPaymentFailed: "Thank you! We couldn't start online payment just now, but your registration is saved — a member of our team will follow up shortly to collect payment.",
  questionsPrefix: "Questions? Call",

  successEyebrow: "Registration",
  successTitle: "Payment received",
  successLede: "Thank you — your deposit is confirmed.",
  successBadge: "Deposit received",
  successHeading: "We look forward to welcoming you",
  successPaid: "Paid so far",
  successTotal: "Trip total",
  successHomeLink: "Back to homepage",
};

export type BookingCopy = typeof BOOKING_COPY_DEFAULTS;

export const BOOKING_COPY_SECTIONS: CopySection[] = [
  {
    title: "Page header",
    description: "{phone} becomes a tappable link to the number in Settings.",
    fields: [
      { key: "headerEyebrow", label: "Small text above the tour name" },
      { key: "headerLede", label: "Intro", multiline: true },
      { key: "noDatesMessage", label: "Message when no dates are published", multiline: true, placeholders: ["phone"] },
      { key: "noOpenDatesMessage", label: "Message when no dates are open", multiline: true, placeholders: ["phone"] },
    ],
  },
  {
    title: "Progress steps and buttons",
    fields: [
      { key: "stepDates", label: "Step 1" },
      { key: "stepParty", label: "Step 2" },
      { key: "stepTravelers", label: "Step 3" },
      { key: "stepContact", label: "Step 4" },
      { key: "stepReview", label: "Step 5" },
      { key: "continueButton", label: "Continue button" },
      { key: "backButton", label: "Back button" },
    ],
  },
  {
    title: "Step 1: Dates",
    fields: [
      { key: "datesHeading", label: "Heading" },
      { key: "assuranceGuaranteed", label: "Guaranteed badge" },
      { key: "assuranceConditional", label: "Not yet guaranteed badge" },
    ],
  },
  {
    title: "Step 2: Party size",
    fields: [
      { key: "partyHeading", label: "Heading" },
      { key: "doubleRooms", label: "Double rooms" },
      { key: "doubleHint", label: "Double rooms hint", optional: true },
      { key: "singleRooms", label: "Single rooms" },
      { key: "singleHint", label: "Single rooms hint", optional: true },
      { key: "singleHintSupplement", label: "Single rooms hint with a supplement", optional: true, placeholders: ["supplement"] },
      { key: "tripleRooms", label: "Triple rooms" },
      { key: "tripleHint", label: "Triple rooms hint", optional: true },
      { key: "children", label: "Children" },
      { key: "travelerSingular", label: "\"Traveler\" (one)" },
      { key: "travelerPlural", label: "\"Travelers\" (several)" },
      { key: "estimatedTotal", label: "Estimated total, here and on the review step" },
      { key: "guaranteedPartyNote", label: "Note for a guaranteed departure", multiline: true },
      { key: "depositNote", label: "Deposit note", multiline: true, placeholders: ["deposit"] },
      { key: "seatsWarning", label: "Too few seats warning", multiline: true, placeholders: ["seats", "spots"] },
    ],
  },
  {
    title: "Step 3: Travelers",
    fields: [
      { key: "travelersHeading", label: "Heading" },
      { key: "travelerCard", label: "Card title", placeholders: ["number"] },
      { key: "firstName", label: "First name" },
      { key: "lastName", label: "Last name" },
      { key: "dateOfBirth", label: "Date of birth" },
      { key: "passportNumber", label: "Passport number" },
      { key: "roomingWith", label: "Rooming with" },
      { key: "dietaryNeeds", label: "Dietary needs" },
      { key: "passportScan", label: "Passport scan" },
      { key: "passportScanOptional", label: "Passport scan, optional note", optional: true },
      { key: "uploadButton", label: "Upload button" },
      { key: "uploadingLabel", label: "While uploading" },
      { key: "passportUploaded", label: "After upload, if the file has no name" },
      { key: "removeButton", label: "Remove button" },
      { key: "secureUploadTitle", label: "Security note, highlighted start" },
      { key: "secureUploadBody", label: "Security note, the rest", multiline: true },
    ],
  },
  {
    title: "Step 4: Contact",
    fields: [
      { key: "contactHeading", label: "Heading" },
      { key: "contactName", label: "Name" },
      { key: "contactEmail", label: "Email" },
      { key: "contactPhone", label: "Phone" },
    ],
  },
  {
    title: "Step 5: Review",
    description: "The cancellation percentages and fee are filled in from the booking policy.",
    fields: [
      { key: "reviewHeading", label: "Heading" },
      { key: "reviewDeparture", label: "Departure row" },
      { key: "reviewTravelers", label: "Travelers row" },
      { key: "reviewBalance", label: "Balance row" },
      { key: "reviewBalanceValue", label: "Balance value", placeholders: ["amount", "days"] },
      { key: "guaranteedReviewNote", label: "Note for a guaranteed departure", multiline: true, placeholders: ["total"] },
      { key: "offlineTitle", label: "No online payment, title" },
      { key: "offlineBody", label: "No online payment, text", multiline: true },
      { key: "paymentChoiceHeading", label: "Payment choice heading" },
      { key: "callbackTitle", label: "Call me option" },
      { key: "callbackBody", label: "Call me text", multiline: true },
      { key: "payOnlineTitle", label: "Pay online option" },
      { key: "payOnlineBody", label: "Pay online text", multiline: true },
      { key: "paymentAmountLabel", label: "Payment slider label" },
      { key: "paymentMinLabel", label: "Slider minimum" },
      { key: "paymentMaxLabel", label: "Slider maximum" },
      { key: "cancellationHeading", label: "Cancellation heading" },
      { key: "cancellationTier", label: "Cancellation line", placeholders: ["days", "percent"] },
      { key: "cancellationFee", label: "Admin fee line", placeholders: ["fee"] },
      { key: "submitOnline", label: "Submit button, online payments on" },
      { key: "submitOffline", label: "Submit button, online payments off" },
      { key: "submitting", label: "While submitting" },
    ],
  },
  {
    title: "Payment and confirmation",
    fields: [
      { key: "paymentHeading", label: "Payment heading" },
      { key: "paymentBody", label: "Payment text", multiline: true, placeholders: ["amount"] },
      { key: "confirmationEyebrow", label: "Confirmation, small text" },
      { key: "confirmationHeading", label: "Confirmation heading" },
      { key: "confirmationCallback", label: "After choosing a call", multiline: true },
      { key: "confirmationPaid", label: "After paying", multiline: true },
      { key: "confirmationPaymentFailed", label: "When online payment could not start", multiline: true },
      { key: "questionsPrefix", label: "Before the phone number" },
    ],
  },
  {
    title: "Payment received page",
    description: "Shown after a payment link is paid.",
    fields: [
      { key: "successEyebrow", label: "Small text above the title" },
      { key: "successTitle", label: "Title" },
      { key: "successLede", label: "Intro", multiline: true },
      { key: "successBadge", label: "Badge" },
      { key: "successHeading", label: "Heading" },
      { key: "successPaid", label: "Paid row" },
      { key: "successTotal", label: "Total row" },
      { key: "successHomeLink", label: "Homepage link" },
    ],
  },
];

export const BLOG_COPY_DEFAULTS = {
  metaDescription: "Destination guides, kashrut logistics, and trip planning from the Keshertours team.",
  eyebrow: "The Journal",
  title: "Stories from the Road",
  lede: "Destination guides, kashrut logistics and trip planning — written by the same team that runs the tours.",
  emptyMessage: "No posts published yet — publish one from /admin/blog to have it appear here.",
  readMore: "Read more",
  backLink: "All posts",
};

export type BlogCopy = typeof BLOG_COPY_DEFAULTS;

export const BLOG_COPY_SECTIONS: CopySection[] = [
  {
    title: "Blog page",
    fields: [
      { key: "eyebrow", label: "Small text above the title", optional: true },
      { key: "title", label: "Title" },
      { key: "lede", label: "Intro", multiline: true, optional: true },
      { key: "emptyMessage", label: "Message when there are no posts", multiline: true },
      { key: "readMore", label: "Link on each post card" },
      { key: "backLink", label: "Link back from a post" },
      { key: "metaDescription", label: "Search engine description", multiline: true },
    ],
  },
];

export const TESTIMONIALS_COPY_DEFAULTS = {
  metaDescription: "What travelers say after touring with Keshertours.",
  eyebrow: "From Our Travelers",
  title: "Testimonials",
  lede: "Real feedback from recent Keshertours departures.",
  emptyMessage: "No approved reviews yet — approve one from /admin/reviews to have it appear here.",
  letterSingular: "letter",
  letterPlural: "letters",
};

export type TestimonialsCopy = typeof TESTIMONIALS_COPY_DEFAULTS;

export const TESTIMONIALS_COPY_SECTIONS: CopySection[] = [
  {
    title: "Testimonials page",
    description: "The letters themselves come from Reviews.",
    fields: [
      { key: "eyebrow", label: "Small text above the title", optional: true },
      { key: "title", label: "Title" },
      { key: "lede", label: "Intro", multiline: true, optional: true },
      { key: "emptyMessage", label: "Message when there are no reviews", multiline: true },
      { key: "letterSingular", label: "Destination card count, one" },
      { key: "letterPlural", label: "Destination card count, several" },
      { key: "metaDescription", label: "Search engine description", multiline: true },
    ],
  },
];
