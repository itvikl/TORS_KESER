import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type {
  SiteContentAbout,
  SiteContentContact,
  SiteContentFaq,
  SiteContentHome,
  SiteContentLegal,
  SiteContentPageKey,
  SiteContentSimplePage,
} from "@/lib/types";

const COLLECTION = "siteContent";

/**
 * Every default below is the copy that was hardcoded directly in the page
 * components before this admin editor existed — seeding with it means the
 * site renders identically on day one, and the admin form opens pre-filled
 * with real copy instead of blank fields.
 */
export const SITE_CONTENT_DEFAULTS = {
  home: {
    heroEyebrow: "Travel the World the Jewish Way",
    heroTitleLine1: "Kosher tours to places you've",
    heroTitleHighlight: "wanted to see",
    heroSubtitle: "Fully escorted, fully kosher journeys worldwide.",
    heroPrimaryCta: "Explore Tours",
    trustSignals: [
      {
        title: "Kashrut You Can Trust",
        body: "Every tour travels with a company mashgiach in addition to local rabbinic supervision — not just a promise, a person.",
      },
      {
        title: "Guided Every Step",
        body: "A Shomer Shabbat, English-speaking guide accompanies the group from arrival to departure.",
      },
      {
        title: "24/7 Support",
        body: "Questions before you go, or while you're there — call anytime, day or night.",
      },
    ],
    ctaHeading: "Design Your Own",
    ctaHeadingHighlight: "Masterpiece Journey",
    ctaBody:
      "From destination planning to kashrut details, we shape every step of the trip around your family's priorities and the experience you want to have.",
    ctaPrimaryButton: "Start a Custom Plan",
    ctaSecondaryButton: "Contact Our Team",
  } satisfies SiteContentHome,

  about: {
    eyebrow: "About Keshertours",
    title: "Travel the world without leaving anything behind",
    lede: "Every Keshertours departure is planned so you never have to choose between seeing the world and keeping the standards you keep at home.",
    sections: [
      {
        sectionId: "approach",
        heading: "Our Approach",
        body: "Every tour is escorted by a Shomer Shabbat, English-speaking guide, and travels with a company mashgiach in addition to local rabbinic or Chabad supervision — kashrut isn't an afterthought bolted onto a standard itinerary, it's planned in from the first day.",
      },
      {
        sectionId: "history",
        heading: "[Company history — years in business, licensing]",
        body: "This section needs real content from the client: founding year, Seller of Travel registration numbers, and any industry affiliations — these are trust signals that matter most to this audience.",
      },
      {
        sectionId: "leadership",
        heading: "[Leadership — Shai Bar Ilan / guide bios]",
        body: "Placeholder for a short bio and photo — testimonials reference trips personally led by Shai Bar Ilan, which is exactly the kind of detail that builds trust with a 50+ audience.",
      },
    ],
  } satisfies SiteContentAbout,

  "custom-tours": {
    eyebrow: "Private Group Travel",
    title: "A tour built entirely around your group",
    lede: "Traveling only with your family, close friends, or community members? We'll design an itinerary just for you — including Roots Tours to your family's ancestral homeland.",
  } satisfies SiteContentSimplePage,

  "special-offers": {
    eyebrow: "Limited Time",
    title: "Special Offers",
    lede: "Seasonal deals and early-booking discounts, published straight from the admin panel — no developer required.",
  } satisfies SiteContentSimplePage,

  testimonials: {
    eyebrow: "From Our Travelers",
    title: "Testimonials",
    lede: "Real feedback from recent Keshertours departures.",
  } satisfies SiteContentSimplePage,

  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        itemId: "kashrut",
        question: "How is kashrut maintained on tour?",
        answer:
          "Every departure travels with a company mashgiach in addition to local Orthodox Rabbinate or Chabad supervision. Meals are prepared with the group's own utensils where needed, and full details are listed on each tour's page under Kashrut & What to Know.",
      },
      {
        itemId: "included",
        question: "What's included in the price?",
        answer:
          "Hotels, kosher meals, ground transportation, entrance fees, and an English-speaking guide are included. International flights are not included unless stated otherwise — see each tour's Prices & Dates section.",
      },
      {
        itemId: "deposit",
        question: "How much is the deposit, and when is the balance due?",
        answer:
          "The deposit amount and balance due date vary by tour and are shown clearly on that tour's page before you book.",
      },
      {
        itemId: "min-group",
        question: "What if the tour doesn't reach minimum group size?",
        answer:
          "Each tour has a minimum number of travelers required to run. If that minimum isn't reached, you'll be notified in advance and offered a full refund.",
      },
      {
        itemId: "older-travelers",
        question: "Is this trip suitable for older travelers?",
        answer:
          "Many of our travelers are 50+. Call us at 1-800-847-0700 and we can talk through the pace and physical demands of any specific tour.",
      },
    ],
  } satisfies SiteContentFaq,

  contact: {
    title: "Contact Us",
    lede: "Call anytime, or send us your travel plans and we'll get back to you.",
  } satisfies SiteContentContact,

  "legal-privacy": {
    title: "Privacy Policy",
    body: "This page needs real content from the client: what personal and payment data is collected (registration forms, Stripe checkout), how it is stored (Firebase), and how travelers can request its deletion. Until this is published, staff should not rely on this page as a binding privacy policy.",
  } satisfies SiteContentLegal,

  "legal-terms": {
    title: "Terms & Conditions",
    body: "This page needs real content from the client: booking terms, liability disclosures, and the cancellation policy in full legal language (the cancellation charge tiers themselves are already implemented — see the Cancellation Policy shown during registration). Until this is published, staff should not rely on this page as a binding terms document.",
  } satisfies SiteContentLegal,
} as const;

export type SiteContentMap = {
  home: SiteContentHome;
  about: SiteContentAbout;
  "custom-tours": SiteContentSimplePage;
  "special-offers": SiteContentSimplePage;
  testimonials: SiteContentSimplePage;
  faq: SiteContentFaq;
  contact: SiteContentContact;
  "legal-privacy": SiteContentLegal;
  "legal-terms": SiteContentLegal;
};

/** Shared by both the public pages and the admin editor forms — merges the saved doc (if any) over the seed default, so a partially-saved doc never blanks out fields it didn't touch. */
export async function getSiteContent<K extends SiteContentPageKey>(
  pageKey: K
): Promise<SiteContentMap[K]> {
  const fallback = SITE_CONTENT_DEFAULTS[pageKey] as SiteContentMap[K];
  const doc = await adminDb().collection(COLLECTION).doc(pageKey).get();
  if (!doc.exists) return fallback;
  return { ...fallback, ...(doc.data() as Partial<SiteContentMap[K]>) };
}

export async function saveSiteContent<K extends SiteContentPageKey>(
  pageKey: K,
  content: SiteContentMap[K]
): Promise<void> {
  await adminDb().collection(COLLECTION).doc(pageKey).set(content);
}
