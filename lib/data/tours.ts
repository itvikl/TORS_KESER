import type { Departure, Tour } from "@/lib/types";
import { computeBalanceDueDate } from "@/lib/cancellationPolicy";

/**
 * Temporary in-memory data layer, seeded with real content from the
 * existing site (scraped during discovery) so every page renders with
 * real copy instead of placeholders. The function signatures here are the
 * contract the rest of the app depends on — swapping the implementation
 * for Firestore reads (via lib/firebase/admin.ts) later requires no
 * changes anywhere else.
 */

const TOURS: Tour[] = [
  {
    tourId: "costa-rica",
    slug: "costa-rica",
    title: "Costa Rica",
    summary:
      "Canyoning, hanging bridges over the rainforest canopy, thermal hot springs, and a catamaran cruise past dolphins and sea turtles — eight days through Costa Rica's rainforests and coastline, fully kosher throughout.",
    description:
      "Eight days through Costa Rica's volcanoes, cloud forests, and Pacific coast — from the Sarchi arts town to the Arenal hanging bridges, Poas Volcano, and a Manuel Antonio catamaran cruise. Shabbat is observed in San Jose with services and a community dinner.",
    heroImage: "/tours/costa-rica/hero.jpg",
    gallery: [
      "/tours/costa-rica/hero.jpg",
      "/tours/costa-rica/canopy.jpg",
      "/tours/costa-rica/beach.jpg",
    ],
    region: "South America",
    travelStyle: "land",
    themeTags: ["Nature", "Adventure", "Family"],
    durationDays: 8,
    minGroupSize: 20,
    flightsIncluded: false,
    inclusions: [
      "All entrance fees",
      "3–4 star hotels and resorts",
      "Private air-conditioned buses",
      "Gratuities for service providers",
      "Kosher full board: breakfast & dinner + packed lunch",
      "English-speaking guide",
    ],
    exclusions: [
      "International round-trip flights",
      "Personal expenses",
      "Travel/luggage insurance",
      "Tour guide gratuity (suggested $5/person/day)",
    ],
    pricing: {
      pricePerPersonDouble: 2895,
      singleSupplement: 890,
      depositAmountPerPerson: 300,
      balanceDueDaysBeforeDeparture: 60,
    },
    kashrutDetails: {
      supervisionLevel: "Local Rabbinate supervision, with a company mashgiach traveling with the group",
      patYisrael: "not_guaranteed",
      chalavYisrael: "not_guaranteed",
      notes:
        "Breakfast and packed lunch prepared using the group's own utensils; dinner is fish or meat with soup, salad, and fresh fruit. Own dishes, cutting boards and pans are used on covered surfaces in hotel kitchens.",
    },
    itineraryDays: [
      {
        dayId: "1",
        dayNumber: 1,
        title: "Arrival & Sarchi",
        description:
          "Flight from the USA to San Jose; check in at Lands-In-Love; visit the Sarchi arts and crafts town.",
        meals: ["Dinner"],
      },
      {
        dayId: "2",
        dayNumber: 2,
        title: "Canyoning & Canopy Tour",
        description:
          "A canyoning adventure followed by a canopy tour through 500+ acres of forest, and an evening night walk.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "3",
        dayNumber: 3,
        title: "Arenal Hanging Bridges",
        description:
          "Travel to Arenal for the hanging bridges tour and an afternoon at the thermal hot springs.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "4",
        dayNumber: 4,
        title: "Poas Volcano & Shabbat",
        description:
          "Poas Volcano crater and La Paz Waterfall Gardens, then return to San Jose for Shabbat services and dinner.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "5",
        dayNumber: 5,
        title: "Shabbat in San Jose",
        description:
          "Shabbat services at the synagogue, community center lunch, and a walking tour of the area.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "6",
        dayNumber: 6,
        title: "San Jose City Tour",
        description:
          "The National Theater and Gold Museum, then transfer to Manuel Antonio with a stop for a crocodile encounter.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "7",
        dayNumber: 7,
        title: "Manuel Antonio & Catamaran",
        description:
          "A guided hike through Manuel Antonio National Park, then an afternoon catamaran cruise with dolphins, sea turtles, and snorkeling in Biesanz Bay.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "8",
        dayNumber: 8,
        title: "Departure",
        description: "Return transfer to the international airport.",
        meals: ["Breakfast"],
      },
    ],
    status: "published",
    seoTitle: "Costa Rica Kosher Tour — 8 Days | Keshertours",
    seoDescription:
      "An 8-day kosher tour of Costa Rica: rainforests, volcanoes, and the Pacific coast, with full kosher board and Shabbat observed in San Jose.",
  },
  {
    tourId: "brazil-argentina",
    slug: "brazil-argentina-tour",
    title: "Argentina & Brazil",
    summary:
      "Thirteen days across two continents' most iconic sights — Iguazu Falls, Rio de Janeiro, and Buenos Aires — fully kosher, escorted throughout.",
    description:
      "Thirteen days through Argentina and Brazil's most celebrated destinations, from the thunder of Iguazu Falls to Rio's Sugarloaf Mountain and the tango halls of Buenos Aires — with kosher dining and Shabbat observance built into every stop.",
    heroImage: "/tours/brazil-argentina/hero.jpg",
    gallery: ["/tours/brazil-argentina/hero.jpg", "/tours/brazil-argentina/falls.jpg"],
    region: "South America",
    travelStyle: "land",
    themeTags: ["Culture", "Nature"],
    durationDays: 13,
    minGroupSize: 20,
    flightsIncluded: false,
    inclusions: [
      "First-class or superior tourist hotels",
      "Kosher meals under Orthodox supervision",
      "Air-conditioned motor-coach transportation",
      "Professional Shomer Shabbat English-speaking guide",
    ],
    exclusions: [
      "International round-trip flights",
      "Airport taxes and fuel charges",
      "Passport/visa fees",
      "Travel insurance",
    ],
    pricing: {
      pricePerPersonDouble: 8990,
      singleSupplement: 2300,
      depositAmountPerPerson: 500,
      balanceDueDaysBeforeDeparture: 90,
    },
    kashrutDetails: {
      supervisionLevel: "Local Orthodox Rabbinate or Chabad supervision",
      patYisrael: "not_guaranteed",
      chalavYisrael: "not_guaranteed",
      notes: "Vegetarian options available on request.",
    },
    itineraryDays: [
      {
        dayId: "1",
        dayNumber: 1,
        title: "Arrival in Buenos Aires",
        description: "Flight from the USA to Buenos Aires; evening welcome dinner.",
        meals: ["Dinner"],
      },
      {
        dayId: "2",
        dayNumber: 2,
        title: "Buenos Aires City Tour",
        description: "A guided tour of Recoleta, La Boca, and a tango show in the evening.",
        meals: ["Breakfast", "Dinner"],
      },
    ],
    status: "published",
    seoTitle: "Argentina & Brazil Kosher Tour — 13 Days | Keshertours",
    seoDescription:
      "A 13-day kosher tour across Argentina and Brazil, from Iguazu Falls to Rio and Buenos Aires, with full kosher dining throughout.",
  },
];

const DEPARTURES: Departure[] = [
  {
    departureId: "costa-rica-2027-01",
    tourId: "costa-rica",
    startDate: "2027-01-19",
    endDate: "2027-01-26",
    capacityTotal: 40,
    capacityBooked: 32,
    capacityHeld: 2,
    minGroupSizeMet: true,
    balanceDueDate: computeBalanceDueDate(new Date("2027-01-19"), 60).toISOString(),
    status: "open",
  },
  {
    departureId: "costa-rica-2027-03",
    tourId: "costa-rica",
    startDate: "2027-03-09",
    endDate: "2027-03-16",
    capacityTotal: 40,
    capacityBooked: 11,
    capacityHeld: 0,
    minGroupSizeMet: false,
    balanceDueDate: computeBalanceDueDate(new Date("2027-03-09"), 60).toISOString(),
    status: "open",
  },
  {
    departureId: "brazil-argentina-2026-11",
    tourId: "brazil-argentina",
    startDate: "2026-11-03",
    endDate: "2026-11-15",
    capacityTotal: 30,
    capacityBooked: 30,
    capacityHeld: 0,
    minGroupSizeMet: true,
    balanceDueDate: computeBalanceDueDate(new Date("2026-11-03"), 90).toISOString(),
    status: "soldout",
  },
];

export async function getAllTours(): Promise<Tour[]> {
  return TOURS.filter((t) => t.status === "published");
}

export async function getTourBySlug(slug: string): Promise<Tour | null> {
  return TOURS.find((t) => t.slug === slug) ?? null;
}

export async function getDeparturesForTour(tourId: string): Promise<Departure[]> {
  return DEPARTURES.filter((d) => d.tourId === tourId).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

export async function getFeaturedTours(limit = 4): Promise<Tour[]> {
  return TOURS.filter((t) => t.status === "published").slice(0, limit);
}
