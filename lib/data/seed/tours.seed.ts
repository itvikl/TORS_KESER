import type { Departure, Tour } from "../../types";
import { computeBalanceDueDate } from "../../cancellationPolicy";

/**
 * Seed content for the Firestore "tours" and "departures" collections,
 * sourced from the existing site during discovery. Push it with
 * `npm run seed` (scripts/seed-firestore.ts) — this file is not read
 * at runtime, only by the seed script.
 */

export const TOURS: Tour[] = [
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
  {
    tourId: "morocco",
    slug: "morocco",
    title: "Morocco",
    summary:
      "Eleven days through Morocco's imperial cities and desert — Marrakech, Fes, the Atlas Mountains, and the magic of the Orient — fully kosher and escorted throughout.",
    description:
      "We invite you to enter a world of mystery: souks and palaces in Marrakech and Fes, mountain passes of the High Atlas, and desert landscapes that feel timeless — with kosher dining and Shabbat observance built into every stop.",
    heroImage: "/tours/morocco/hero.jpg",
    gallery: ["/tours/morocco/hero.jpg", "/tours/morocco/medina.jpg"],
    region: "Africa",
    travelStyle: "land",
    themeTags: ["Culture", "Jewish Heritage", "Adventure"],
    durationDays: 11,
    minGroupSize: 20,
    flightsIncluded: false,
    inclusions: [
      "First-class or superior tourist hotels",
      "Kosher meals under Orthodox supervision",
      "Air-conditioned motor-coach transportation",
      "Professional Shomer Shabbat English-speaking guide",
      "Entrance fees to sites on the itinerary",
    ],
    exclusions: [
      "International round-trip flights",
      "Personal expenses",
      "Travel insurance",
      "Tour guide gratuity",
    ],
    pricing: {
      pricePerPersonDouble: 4295,
      singleSupplement: 1100,
      depositAmountPerPerson: 400,
      balanceDueDaysBeforeDeparture: 60,
    },
    kashrutDetails: {
      supervisionLevel: "Company mashgiach traveling with the group; local Orthodox supervision where available",
      patYisrael: "not_guaranteed",
      chalavYisrael: "not_guaranteed",
      notes:
        "Breakfast and packed lunch prepared using the group's own utensils; dinner fish or meat with soup, salad, and fresh fruit.",
    },
    itineraryDays: [
      {
        dayId: "1",
        dayNumber: 1,
        title: "Arrival in Casablanca",
        description:
          "Flight from the USA; welcome dinner and orientation in Casablanca.",
        meals: ["Dinner"],
      },
      {
        dayId: "2",
        dayNumber: 2,
        title: "Casablanca & Rabat",
        description:
          "Hassan II Mosque exterior, Jewish heritage sites, then continue to Rabat for the royal capital highlights.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "3",
        dayNumber: 3,
        title: "Fes Medina",
        description:
          "Explore the ancient medina, tanneries, and Jewish quarter of Fes.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
    ],
    status: "published",
    seoTitle: "Morocco Kosher Tour — 11 Days | Keshertours",
    seoDescription:
      "An 11-day kosher tour of Morocco: Marrakech, Fes, the Atlas Mountains, and desert landscapes, with full kosher board throughout.",
  },
  {
    tourId: "tanzania-safari",
    slug: "kosher-safari-tanzania",
    title: "Tanzania Safari",
    summary:
      "Eight days on safari through Tanzania's northern parks — Tarangire, Lake Manyara, Ngorongoro Crater, and the Serengeti — fully kosher in the wild.",
    description:
      "A kosher safari deep into four of Tanzania's most renowned wilderness areas: Tarangire's elephant country and baobabs, Lake Manyara's Rift Valley forests, Ngorongoro Crater, and the legendary Serengeti plains — with Shabbat-friendly arrangements and supervised kosher meals throughout.",
    heroImage: "/tours/tanzania/hero.jpg",
    gallery: ["/tours/tanzania/hero.jpg", "/tours/tanzania/serengeti.jpg"],
    region: "Africa",
    travelStyle: "luxury",
    themeTags: ["Safari", "Nature", "Adventure"],
    durationDays: 8,
    minGroupSize: 16,
    flightsIncluded: false,
    inclusions: [
      "Safari lodges and tented camps",
      "Game drives in private vehicles",
      "Kosher full board under Orthodox supervision",
      "Park entrance fees",
      "Professional Shomer Shabbat English-speaking guide",
    ],
    exclusions: [
      "International round-trip flights",
      "Internal flights (if required)",
      "Personal expenses",
      "Travel/luggage insurance",
      "Guide and driver gratuities",
    ],
    pricing: {
      pricePerPersonDouble: 6895,
      singleSupplement: 1890,
      depositAmountPerPerson: 500,
      balanceDueDaysBeforeDeparture: 90,
    },
    kashrutDetails: {
      supervisionLevel: "Company mashgiach traveling with the group",
      patYisrael: "not_guaranteed",
      chalavYisrael: "not_guaranteed",
      notes:
        "Strictly kosher meals prepared under supervision at lodges using the group's equipment where needed. Shabbat observed at camp with services and communal meals.",
    },
    itineraryDays: [
      {
        dayId: "1",
        dayNumber: 1,
        title: "Arrival & Tarangire",
        description:
          "Arrive in Tanzania and transfer to Tarangire National Park for an afternoon game drive among baobabs and elephant herds.",
        meals: ["Dinner"],
      },
      {
        dayId: "2",
        dayNumber: 2,
        title: "Tarangire Full Day",
        description:
          "Full-day safari in Tarangire — elephants, zebra, giraffe, and birdlife along the river.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "3",
        dayNumber: 3,
        title: "Lake Manyara",
        description:
          "Descend into Lake Manyara National Park beneath the Rift Valley escarpment — forests, flamingos, and tree-climbing lions.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "4",
        dayNumber: 4,
        title: "Ngorongoro Crater",
        description:
          "Descend into Ngorongoro Crater for a full day among the Big Five in Africa's Garden of Eden.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
    ],
    status: "published",
    seoTitle: "Tanzania Kosher Safari — 8 Days | Keshertours",
    seoDescription:
      "An 8-day kosher safari through Tarangire, Lake Manyara, Ngorongoro, and the Serengeti, with full kosher board and Shabbat-friendly arrangements.",
  },
  {
    tourId: "portugal",
    slug: "portugal",
    title: "Portugal",
    summary:
      "Nine days through Portugal with an emphasis on Jewish heritage — Lisbon, Belmonte, Porto, Sintra, and the Atlantic coast — fully kosher and escorted.",
    description:
      "Portugal & Its Jewish Heritage: Lisbon's Belem and Sha'arei Tikva, the Juderia of Castelo de Vide, Belmonte's Bnei Anusim community, Porto's Kadoorie synagogue, Tomar's ancient synagogue, and the western tip of Europe at Cabo da Roca.",
    heroImage: "/tours/portugal/hero.jpg",
    gallery: ["/tours/portugal/hero.jpg", "/tours/portugal/lisbon.jpg"],
    region: "Europe",
    travelStyle: "land",
    themeTags: ["Jewish Heritage", "Culture", "History"],
    durationDays: 9,
    minGroupSize: 20,
    flightsIncluded: false,
    inclusions: [
      "First-class and 5* hotels on breakfast basis",
      "Entrance fees as per the itinerary",
      "Air-conditioned touring coach",
      "Kosher dinners at local kosher restaurants; fish dinners at hotels",
      "Tips for local service providers",
      "Professional English-speaking guide",
    ],
    exclusions: [
      "International flights and taxes",
      "Travel and health insurance",
      "Personal expenses",
      "Tour guide gratuity (recommended $5–$7 per person per day)",
    ],
    pricing: {
      pricePerPersonDouble: 4250,
      singleSupplement: 1350,
      depositAmountPerPerson: 500,
      balanceDueDaysBeforeDeparture: 60,
    },
    kashrutDetails: {
      supervisionLevel: "Local Rabbinate hashgacha; company mashgiach traveling with the group",
      patYisrael: "not_guaranteed",
      chalavYisrael: "not_guaranteed",
      notes:
        "Kosher dinners at local kosher restaurants where available; hotel kitchens kashered with the group's own equipment under mashgiach supervision.",
    },
    itineraryDays: [
      {
        dayId: "1",
        dayNumber: 1,
        title: "Lisbon",
        description:
          "Sightseeing in Lisbon including Belem and the Monument of the Discoveries; walk the old Jewish neighborhood and visit Sha'arei Tikva Synagogue.",
        meals: ["Dinner"],
      },
      {
        dayId: "2",
        dayNumber: 2,
        title: "Evora & Castelo de Vide",
        description:
          "Medieval Evora, then Castelo de Vide's Juderia and synagogue museum; continue toward Castelo Branco.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "3",
        dayNumber: 3,
        title: "Belmonte to Porto",
        description:
          "Belmonte Jewish Museum and Beit Eliyahu, Guarda and Trancoso Jewish quarters, then arrive in Porto.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
    ],
    status: "published",
    seoTitle: "Portugal Kosher Tour — 9 Days | Keshertours",
    seoDescription:
      "A 9-day kosher tour of Portugal focused on Jewish heritage: Lisbon, Belmonte, Porto, Sintra, and the Atlantic coast.",
  },
  {
    tourId: "italy",
    slug: "italy",
    title: "Italy",
    summary:
      "Eleven days through the heart of Italy — Rome, Florence, Tuscany, Venice's historic Ghetto, and Milan — fully kosher with Shabbat in the hills.",
    description:
      "From Rome's Colosseum and Forum to Siena, Florence, Pisa, Verona, Lake Garda, and Venice's Spanish Synagogue — an 11-day kosher journey through Italy's history, art, and Jewish heritage, ending in Milan and the Lake District.",
    heroImage: "/tours/italy/hero.jpg",
    gallery: ["/tours/italy/hero.jpg", "/tours/italy/venice.jpg"],
    region: "Europe",
    travelStyle: "land",
    themeTags: ["Culture", "Jewish Heritage", "Art"],
    durationDays: 11,
    minGroupSize: 20,
    flightsIncluded: false,
    inclusions: [
      "First-class hotels",
      "Kosher meals under Orthodox supervision",
      "Air-conditioned motor-coach transportation",
      "Entrance fees to sites on the itinerary",
      "Professional Shomer Shabbat English-speaking guide",
    ],
    exclusions: [
      "International round-trip flights",
      "Personal expenses",
      "Travel insurance",
      "Tour guide gratuity",
    ],
    pricing: {
      pricePerPersonDouble: 5490,
      singleSupplement: 1650,
      depositAmountPerPerson: 500,
      balanceDueDaysBeforeDeparture: 60,
    },
    kashrutDetails: {
      supervisionLevel: "Company mashgiach traveling with the group; local Orthodox supervision where available",
      patYisrael: "not_guaranteed",
      chalavYisrael: "not_guaranteed",
      notes: "Shabbat observed in Tuscany with services and communal kosher meals.",
    },
    itineraryDays: [
      {
        dayId: "1",
        dayNumber: 1,
        title: "Arrival in Rome",
        description: "Welcome to Rome; evening orientation and kosher dinner.",
        meals: ["Dinner"],
      },
      {
        dayId: "2",
        dayNumber: 2,
        title: "Classical Rome",
        description:
          "Colosseum, Roman Forum, and piazzas; afternoon visit to Tivoli's gardens.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "3",
        dayNumber: 3,
        title: "Siena & Florence",
        description:
          "Medieval Siena then Florence's artistic masterpieces and Jewish heritage sites.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
    ],
    status: "published",
    seoTitle: "Italy Kosher Tour — 11 Days | Keshertours",
    seoDescription:
      "An 11-day kosher tour of Italy: Rome, Florence, Tuscany, Venice's Ghetto, and Milan, with full kosher board throughout.",
  },
  {
    tourId: "japan",
    slug: "japan",
    title: "Japan",
    summary:
      "Ten days through Japan — Tokyo, Hakone and Mount Fuji, Kyoto, Nara, Hiroshima, and Osaka — tradition and modernity, fully kosher.",
    description:
      "The Japanese Legend: Contrasts of Tradition & Modernity. From Meiji Shrine and Shibuya to Hakone's views of Fuji, Kyoto's Golden Pavilion, Hiroshima's Peace Memorial, Miyajima's floating torii, and Osaka's lively streets — with kosher meals and Shabbat throughout.",
    heroImage: "/tours/japan/hero.jpg",
    gallery: ["/tours/japan/hero.jpg", "/tours/japan/kyoto.jpg"],
    region: "Asia & Far East",
    travelStyle: "land",
    themeTags: ["Culture", "Nature", "Tradition"],
    durationDays: 10,
    minGroupSize: 20,
    flightsIncluded: false,
    inclusions: [
      "First-class hotels",
      "Kosher meals under Orthodox supervision",
      "Domestic transportation as per itinerary",
      "Entrance fees to sites on the itinerary",
      "Professional Shomer Shabbat English-speaking guide",
    ],
    exclusions: [
      "International round-trip flights",
      "Personal expenses",
      "Travel insurance",
      "Tour guide gratuity",
    ],
    pricing: {
      pricePerPersonDouble: 6290,
      singleSupplement: 1850,
      depositAmountPerPerson: 500,
      balanceDueDaysBeforeDeparture: 90,
    },
    kashrutDetails: {
      supervisionLevel: "Company mashgiach traveling with the group",
      patYisrael: "not_guaranteed",
      chalavYisrael: "not_guaranteed",
      notes:
        "Strictly kosher meals prepared under supervision; Shabbat-friendly hotel arrangements in Kyoto or Tokyo depending on departure.",
    },
    itineraryDays: [
      {
        dayId: "1",
        dayNumber: 1,
        title: "Arrival in Tokyo",
        description: "Arrive in Tokyo; evening welcome dinner.",
        meals: ["Dinner"],
      },
      {
        dayId: "2",
        dayNumber: 2,
        title: "Tokyo Highlights",
        description:
          "Meiji Shrine, Shibuya crossing, and modern Tokyo neighborhoods.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "3",
        dayNumber: 3,
        title: "Hakone & Mount Fuji",
        description:
          "Scenic Hakone — Owakudani, Lake Ashi cruise, and views of Mount Fuji when weather allows.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
    ],
    status: "published",
    seoTitle: "Japan Kosher Tour — 10 Days | Keshertours",
    seoDescription:
      "A 10-day kosher tour of Japan: Tokyo, Hakone, Kyoto, Hiroshima, and Osaka, with full kosher dining throughout.",
  },
  {
    tourId: "vietnam-cambodia",
    slug: "vietnam-cambodia",
    title: "Vietnam & Cambodia",
    summary:
      "Fourteen days through Vietnam and Cambodia — the Pearl of the East — rivers, temples, and cities where authenticity can still be felt, fully kosher.",
    description:
      "A journey across Southeast Asia's most captivating destinations: bustling cities, tranquil river cruises, Angkor's temples, and local culture — with kosher board and a guide traveling with you every step.",
    heroImage: "/tours/vietnam-cambodia/hero.jpg",
    gallery: [
      "/tours/vietnam-cambodia/hero.jpg",
      "/tours/vietnam-cambodia/angkor.jpg",
    ],
    region: "Asia & Far East",
    travelStyle: "land",
    themeTags: ["Culture", "History", "Nature"],
    durationDays: 14,
    minGroupSize: 20,
    flightsIncluded: false,
    inclusions: [
      "First-class hotels",
      "Kosher meals under Orthodox supervision",
      "Domestic flights and ground transport as per itinerary",
      "Entrance fees to sites on the itinerary",
      "Professional Shomer Shabbat English-speaking guide",
    ],
    exclusions: [
      "International round-trip flights",
      "Visa fees",
      "Personal expenses",
      "Travel insurance",
      "Tour guide gratuity",
    ],
    pricing: {
      pricePerPersonDouble: 5790,
      singleSupplement: 1550,
      depositAmountPerPerson: 500,
      balanceDueDaysBeforeDeparture: 90,
    },
    kashrutDetails: {
      supervisionLevel: "Company mashgiach traveling with the group",
      patYisrael: "not_guaranteed",
      chalavYisrael: "not_guaranteed",
      notes:
        "Meals prepared under mashgiach supervision using the group's utensils in hotel kitchens where needed.",
    },
    itineraryDays: [
      {
        dayId: "1",
        dayNumber: 1,
        title: "Arrival in Vietnam",
        description: "Arrive and transfer to the hotel; welcome dinner.",
        meals: ["Dinner"],
      },
      {
        dayId: "2",
        dayNumber: 2,
        title: "City & Culture",
        description:
          "Explore the capital's historic quarter, markets, and cultural landmarks.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      {
        dayId: "3",
        dayNumber: 3,
        title: "Toward Cambodia",
        description:
          "Continue south toward Cambodia; evening orientation for Angkor.",
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
    ],
    status: "published",
    seoTitle: "Vietnam & Cambodia Kosher Tour — 14 Days | Keshertours",
    seoDescription:
      "A 14-day kosher tour of Vietnam and Cambodia: cities, rivers, and Angkor temples, with full kosher dining throughout.",
  },
];

function mockDeparture(
  tourId: string,
  startDate: string,
  endDate: string,
  opts: {
    capacityTotal: number;
    capacityBooked: number;
    capacityHeld?: number;
    balanceDueDays: number;
    status: Departure["status"];
    minGroupSizeMet?: boolean;
  }
): Departure {
  return {
    departureId: `${tourId}-${startDate}`,
    tourId,
    startDate,
    endDate,
    capacityTotal: opts.capacityTotal,
    capacityBooked: opts.capacityBooked,
    capacityHeld: opts.capacityHeld ?? 0,
    minGroupSizeMet: opts.minGroupSizeMet ?? opts.capacityBooked >= 20,
    balanceDueDate: computeBalanceDueDate(
      new Date(startDate),
      opts.balanceDueDays
    ).toISOString(),
    status: opts.status,
  };
}

/** Two mock departures per tour. */
export const DEPARTURES: Departure[] = [
  // Costa Rica
  mockDeparture("costa-rica", "2027-01-19", "2027-01-26", {
    capacityTotal: 40,
    capacityBooked: 32,
    capacityHeld: 2,
    balanceDueDays: 60,
    status: "open",
    minGroupSizeMet: true,
  }),
  mockDeparture("costa-rica", "2027-03-09", "2027-03-16", {
    capacityTotal: 40,
    capacityBooked: 11,
    balanceDueDays: 60,
    status: "open",
    minGroupSizeMet: false,
  }),
  // Argentina & Brazil
  mockDeparture("brazil-argentina", "2026-11-03", "2026-11-15", {
    capacityTotal: 30,
    capacityBooked: 30,
    balanceDueDays: 90,
    status: "soldout",
    minGroupSizeMet: true,
  }),
  mockDeparture("brazil-argentina", "2027-02-16", "2027-02-28", {
    capacityTotal: 30,
    capacityBooked: 14,
    capacityHeld: 2,
    balanceDueDays: 90,
    status: "open",
    minGroupSizeMet: true,
  }),
  // Morocco (Africa)
  mockDeparture("morocco", "2026-12-01", "2026-12-11", {
    capacityTotal: 35,
    capacityBooked: 22,
    capacityHeld: 1,
    balanceDueDays: 60,
    status: "open",
    minGroupSizeMet: true,
  }),
  mockDeparture("morocco", "2027-04-13", "2027-04-23", {
    capacityTotal: 35,
    capacityBooked: 8,
    balanceDueDays: 60,
    status: "open",
    minGroupSizeMet: false,
  }),
  // Tanzania Safari (Africa)
  mockDeparture("tanzania-safari", "2027-01-12", "2027-01-19", {
    capacityTotal: 24,
    capacityBooked: 18,
    capacityHeld: 2,
    balanceDueDays: 90,
    status: "open",
    minGroupSizeMet: true,
  }),
  mockDeparture("tanzania-safari", "2027-06-08", "2027-06-15", {
    capacityTotal: 24,
    capacityBooked: 5,
    balanceDueDays: 90,
    status: "open",
    minGroupSizeMet: false,
  }),
  // Portugal (Europe)
  mockDeparture("portugal", "2026-10-20", "2026-10-28", {
    capacityTotal: 35,
    capacityBooked: 27,
    capacityHeld: 1,
    balanceDueDays: 60,
    status: "open",
    minGroupSizeMet: true,
  }),
  mockDeparture("portugal", "2027-05-11", "2027-05-19", {
    capacityTotal: 35,
    capacityBooked: 9,
    balanceDueDays: 60,
    status: "open",
    minGroupSizeMet: false,
  }),
  // Italy (Europe)
  mockDeparture("italy", "2026-09-08", "2026-09-18", {
    capacityTotal: 36,
    capacityBooked: 36,
    balanceDueDays: 60,
    status: "soldout",
    minGroupSizeMet: true,
  }),
  mockDeparture("italy", "2027-04-20", "2027-04-30", {
    capacityTotal: 36,
    capacityBooked: 12,
    capacityHeld: 2,
    balanceDueDays: 60,
    status: "open",
    minGroupSizeMet: false,
  }),
  // Japan (Asia & Far East)
  mockDeparture("japan", "2026-11-09", "2026-11-18", {
    capacityTotal: 30,
    capacityBooked: 21,
    capacityHeld: 1,
    balanceDueDays: 90,
    status: "open",
    minGroupSizeMet: true,
  }),
  mockDeparture("japan", "2027-03-22", "2027-03-31", {
    capacityTotal: 30,
    capacityBooked: 6,
    balanceDueDays: 90,
    status: "open",
    minGroupSizeMet: false,
  }),
  // Vietnam & Cambodia (Asia & Far East)
  mockDeparture("vietnam-cambodia", "2026-10-20", "2026-11-02", {
    capacityTotal: 28,
    capacityBooked: 16,
    capacityHeld: 2,
    balanceDueDays: 90,
    status: "open",
    minGroupSizeMet: true,
  }),
  mockDeparture("vietnam-cambodia", "2027-02-09", "2027-02-22", {
    capacityTotal: 28,
    capacityBooked: 4,
    balanceDueDays: 90,
    status: "open",
    minGroupSizeMet: false,
  }),
];
