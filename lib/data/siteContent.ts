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
    body: `KESHER TOURS, INC.
WEBSITE TERMS OF USE AND TOUR BOOKING TERMS & CONDITIONS
Effective Date: September 3, 2026

These Website Terms of Use and Tour Booking Terms & Conditions (collectively, the "Terms") govern access to and use of https://keshertours.com (the "Website") and all reservations for tours, travel packages, land-only arrangements, and related travel services offered by Kesher Tours, Inc. ("Kesher," "we," "us," or "our").

Please read these Terms carefully before using the Website or making a reservation. By submitting a reservation, paying a deposit or other amount, signing or electronically accepting a booking document, or participating in a tour, the traveler agrees to these Terms. If one person makes a reservation for other travelers, that person confirms that he or she is authorized to accept these Terms for every traveler included in the reservation and will provide a copy to each traveler.

These Terms are subject to all non-waivable rights and remedies provided by applicable law. Nothing in these Terms limits a right that cannot lawfully be limited or waived.

1. ABOUT KESHER AND SCOPE OF THESE TERMS

Kesher Tours, Inc. is a New York tour operator offering organized kosher group tours and related travel services.

Contact information:
Kesher Tours, Inc.
209 East 56th Street, #4E
New York, NY 10022
Telephone: 1-212-481-3721 or 1-800-847-0700
Website: https://keshertours.com

These Terms apply to both the Website and travel services booked with Kesher. A specific tour may have additional written terms, including its itinerary, price, payment schedule, minimum group size, cancellation schedule, health or mobility requirements, and included or excluded services (the "Tour-Specific Terms").

The contract for a reservation consists of: (a) the booking confirmation or invoice; (b) the Tour-Specific Terms; (c) these Terms; and (d) any supplier terms expressly incorporated into the booking. If there is a conflict, the booking confirmation and Tour-Specific Terms control regarding the particular tour, while these Terms control regarding general legal and Website matters. Mandatory law always controls.

2. CONTRACT FORMATION AND BOOKING AUTHORITY

Information displayed on the Website is an invitation to make a reservation and is not, by itself, a binding offer. A reservation is accepted only when Kesher issues a written confirmation and receives the required payment. Availability, schedules, airfares, exchange rates, supplier confirmations, and prices may change before Kesher confirms the reservation.

The person making a group or household reservation is the "Lead Traveler." The Lead Traveler is responsible for providing accurate information, communicating all booking documents and changes to the other travelers, and making payments when due. Each traveler remains responsible for complying with these Terms.

A parent or legal guardian must make and accept a booking for a traveler under 18 years of age. Minors must travel with, and remain under the supervision of, a responsible adult unless Kesher expressly agrees otherwise in writing.

3. TOUR DESCRIPTIONS, ITINERARIES, AND TOUR-SPECIFIC DISCLOSURES

Kesher will provide written Tour-Specific Terms identifying the material details known at the time of booking, which may include the destination, departure date, transportation, accommodations, meals, sightseeing, price, amount and purpose of payments, balance due date, cancellation rules, minimum group size, and important limitations or contingencies.

Travel involves changing circumstances. Photographs, maps, descriptions, hotel classifications, flight times, and itineraries are provided in good faith for general guidance. Hotel ratings are based on local standards and may differ from standards in the United States. Published schedules and itineraries are not guarantees that every service will occur at the exact stated time or in the exact stated order.

Kesher may correct a genuine typographical, calculation, or publishing error before accepting a reservation. If a material error is discovered after acceptance, Kesher will promptly notify the traveler and offer the lawful remedy appropriate to the circumstances, which may include honoring the corrected booking with the traveler's agreement or allowing the traveler to cancel for a refund of the affected amounts paid to Kesher.

4. PRICES, TAXES, AND CURRENCY

Unless expressly stated otherwise, prices are quoted in U.S. dollars, per person, based on two travelers sharing a twin or double room. Single supplements, upgrades, optional excursions, and other optional services are additional.

Any advertised price for air transportation or a tour that includes air transportation will state the total price payable to Kesher, including mandatory taxes, fees, and carrier-imposed charges, as required by applicable law. A charge will not be treated as optional unless the traveler may decline it. Optional services will be added only with the traveler's affirmative agreement.

Prices are based on the tariffs, taxes, fuel costs, supplier prices, and currency exchange rates applicable when the tour is priced. Before confirmation, prices are subject to availability and change. After confirmation, Kesher will not impose a price increase unless the possibility and method of the increase were clearly disclosed in the Tour-Specific Terms or the increase is required by law. If applicable law gives the traveler a right to reject a material post-booking increase, Kesher will honor that right.

The traveler is responsible for personal bank fees, foreign transaction fees, or exchange-rate differences charged by the traveler's financial institution.

5. RESERVATIONS, DEPOSITS, AND FINAL PAYMENT

Unless the Tour-Specific Terms provide otherwise, a deposit of $500 per person is required at the time of booking. The deposit is credited toward the tour price. Whether and to what extent the deposit is refundable is determined by the cancellation schedule disclosed for the specific tour before payment.

Unless the Tour-Specific Terms provide otherwise, final payment is due 60 days before departure. Kesher may cancel a reservation for nonpayment after giving reasonable notice. Any cancellation charge will be determined under the cancellation schedule that applied to the booking; nonpayment does not create an additional or undisclosed forfeiture.

Late payment may result in the loss of reserved space, a higher airfare or supplier price, or other additional costs, but Kesher will disclose and obtain agreement to any additional amount before charging it.

The traveler authorizes Kesher to charge only the amounts agreed to for the reservation. Any credit-card hold or authorization will be disclosed and handled in accordance with applicable law. A credit-card surcharge, if any, will be included in the displayed credit-card price and disclosed before payment.

6. CANCELLATION BY THE TRAVELER

All cancellations must be made in writing and are effective when received by Kesher. A cancellation may be sent to the email address stated in the booking confirmation or delivered or mailed to Kesher at the address in Section 1. The traveler should retain proof of delivery.

Cancellation charges for land services are tour-specific and must be disclosed on the tour page, booking form, quotation, or confirmation before the traveler pays. The applicable cancellation schedule forms part of the contract. If no land-services cancellation schedule was disclosed before booking, Kesher will not apply an undisclosed standardized penalty, but may deduct amounts that were clearly disclosed as nonrefundable or that Kesher has actually paid or become contractually obligated to pay to suppliers and cannot reasonably recover, to the extent permitted by law.

Airline tickets and other supplier services may be nonrefundable or subject to separate change and cancellation charges. Those rules must be disclosed or made available before ticketing or purchase. Airline and supplier penalties are in addition to any disclosed Kesher land-services cancellation charge only when this is stated in the Tour-Specific Terms.

A request to change a traveler's name, departure date, room arrangement, flight, or other material booking detail may require cancellation and rebooking. Kesher will advise the traveler of the applicable cost before making the change. Name corrections are subject to airline and supplier rules and availability.

No employee, tour escort, guide, or agent may waive a cancellation charge unless the waiver is confirmed in writing by an authorized Kesher representative.

Nothing in this section limits any statutory cancellation right. If New York General Business Law Section 157-a or another cooling-off law applies to a particular transaction, Kesher will provide the required written disclosure and cancellation notice, and the statutory right will control.

7. CHANGES OR CANCELLATION BY KESHER

Kesher may make reasonable changes to an itinerary, hotel, flight, carrier, guide, meal venue, sightseeing visit, or sequence when necessary for safety, religious observance, operational reasons, supplier changes, local conditions, or events beyond Kesher's reasonable control. When reasonably possible, a substituted service will be of a similar standard. No change will be described as equivalent if it is materially different.

Kesher may cancel a tour if the disclosed minimum number of participants is not reached. Unless the Tour-Specific Terms provide an earlier deadline, Kesher may cancel for insufficient enrollment up to 21 days before departure. If Kesher cancels before departure for insufficient enrollment or another business reason within its control, the traveler may accept an offered alternative or receive a refund of the amounts paid to Kesher for the canceled tour. Kesher is not responsible for independently purchased flights, hotels, visas, insurance, or other arrangements.

If Kesher must cancel, suspend, or materially change a tour because of a Force Majeure Event, Kesher may offer a reasonable alternative, postponement, credit, or refund. Any refund may be reduced by amounts already paid or contractually committed to suppliers and not recoverable despite reasonable efforts, except where applicable law requires a greater refund. Kesher will pass through any supplier refund or credit that it actually receives and that is attributable and legally due to the traveler, subject to any previously disclosed lawful fee.

If a material change is made before departure for a reason within Kesher's control, Kesher will provide the alternatives or refund required by applicable law and the Tour-Specific Terms.

8. FORCE MAJEURE

A "Force Majeure Event" is an event beyond Kesher's reasonable control that prevents, materially impairs, or makes unsafe the performance of travel services. Examples include severe weather, natural disaster, fire, flood, epidemic, pandemic, public-health emergency, quarantine, war, terrorism, civil unrest, governmental order or advisory, sanctions, border or airspace closure, visa or entry-rule changes, strikes or labor disruption, transportation shutdown, carrier cancellation, infrastructure failure, or a comparable event.

Kesher will use commercially reasonable efforts to assist travelers and reduce disruption, but cannot guarantee replacement services. Additional lodging, meals, transportation, testing, quarantine, evacuation, or other costs caused by a Force Majeure Event are the traveler's responsibility unless Kesher or a supplier is legally required to pay them. This is an important reason to purchase comprehensive travel insurance.

9. AIR TRANSPORTATION

Air transportation is included only when expressly stated in the Tour-Specific Terms. Airfares, tickets, schedules, aircraft, routes, baggage allowances, seat assignments, and loyalty benefits are governed by the operating and ticketing carriers' conditions of carriage and applicable law.

Airlines are independent suppliers. Flight delays, cancellations, schedule changes, rerouting, denied boarding, and baggage problems may occur. Kesher does not control airline operations, but will not disclaim any duty imposed on it by applicable law and will provide reasonable assistance when it arranged the affected service.

Rights and remedies relating to air transportation may be governed by the carrier's contract of carriage, U.S. Department of Transportation rules, and international conventions, including the Montreal Convention or, where still applicable, the Warsaw Convention. Nothing in these Terms reduces a passenger right that cannot legally be waived.

Travelers must reconfirm flight details, arrive by the required check-in time, comply with security requirements, and verify baggage rules directly with the airline before travel. Seat assignments and special-service requests are not guaranteed unless confirmed by the airline.

Travelers arranging their own international flights should not issue nonrefundable tickets until Kesher confirms in writing that the tour is guaranteed to operate. Kesher is not responsible for the cost or consequences of independently arranged travel, including a missed connection with the group.

10. LAND-ONLY ARRANGEMENTS AND TRANSFERS

Some tours may be purchased without international airfare. Land-only travelers are responsible for arranging transportation to and from the tour's stated starting and ending points.

Airport transfers are included only for the designated group flights or when specifically listed in the Tour-Specific Terms. A traveler who selects different flights, changes a flight, arrives late, or books land-only services is responsible for any separate transfer and for joining the group at the specified place and time.

Kesher is not responsible for missed land services caused by a traveler's independently arranged flight delay or cancellation, but will make reasonable efforts to help the traveler rejoin the group at the traveler's expense.

11. HOTELS AND ROOM ARRANGEMENTS

Hotels are selected according to the tour itinerary, local classification standards, location, Shabbat requirements, and availability. In remote destinations, or where required for Shabbat logistics, accommodations may be of a different category than those used elsewhere on the tour.

Kesher may request lower-floor rooms for Shabbat, but cannot guarantee them. Room location, floor, view, bedding configuration, and final room assignment are controlled by the hotel. Requests for adjoining rooms, connecting rooms, non-smoking rooms, specific beds, or other features must be made at booking and are not guaranteed unless the hotel confirms them.

A triple room may include a rollaway bed or sofa bed and may have limited space. Single rooms, particularly in Europe, may be smaller than twin rooms. A hotel may be substituted when necessary; Kesher will seek a reasonably comparable alternative when possible.

A preliminary or final hotel list may change before or during travel because of circumstances outside Kesher's control. Kesher will notify travelers of material changes when reasonably possible.

12. KOSHER MEALS AND DIETARY REQUESTS

The meals included in a tour are those stated in the Tour-Specific Terms. Arrangements may include continental hotel breakfasts, provisions for preparing a packed lunch, dinners at kosher restaurants or Jewish community facilities, catered meals, or meals prepared or handled under arrangements supervised by an identified rabbinical authority, Chabad representative, or Kesher tour staff member, as described for the specific tour.

Where local kosher facilities are limited, meals may be simple, packaged, vegetarian, prepared with Kesher's own utensils and disposable serviceware, or otherwise different from meals available in locations with established kosher infrastructure.

Unless expressly confirmed in the Tour-Specific Terms, Kesher does not guarantee Pas Yisrael or Cholov Yisrael. The level and source of kosher supervision may vary by tour and location and will be described in the applicable tour materials when known.

Vegetarian, allergy-related, medical, or other special meal requests must be made at booking. Kesher will communicate reasonable requests to suppliers but cannot guarantee that every request can be accommodated or that an environment will be free of allergens or cross-contact. A traveler with a severe allergy or medical dietary need must assess the suitability of the arrangements and carry any necessary medication.

Unless stated otherwise, beverages and food ordered outside the included meal plan are at the traveler's expense.

13. GROUND TRANSPORTATION, SIGHTSEEING, AND TOUR ESCORTS

Ground transportation is generally provided by private motor coach or another vehicle appropriate to local conditions. Vehicles may be air-conditioned or air-ventilated depending on the destination and availability. Driver working hours and routes are subject to local laws, safety rules, traffic, road conditions, and mandatory rest periods.

Drivers are not required to provide services outside the confirmed itinerary. Any requested additional transportation is subject to Kesher's prior approval, driver availability, legal driving-hour limits, and an agreed additional charge.

Admission fees and sightseeing are included only as stated in the itinerary. Kesher may change or omit a visit because of closure, safety, religious observance, local restrictions, delay, or another operational necessity. Itineraries are planned to avoid scheduled travel on Shabbat, except when an emergency or safety issue requires otherwise.

Kesher tours are generally accompanied by an English-speaking, Shomer Shabbat tour escort or tour manager. Depending on the destination, the escort may also perform guiding functions where lawful, and local licensed guides may be used where required or appropriate. The identity of a particular escort or guide is not guaranteed unless expressly stated in writing.

14. BAGGAGE

Airline baggage allowances and charges vary and must be checked directly with the airline. Because motor-coach space is limited, unless the Tour-Specific Terms state otherwise, each traveler may bring one standard suitcase and one small personal item that fits under a seat.

Porterage, when included, covers one suitcase per traveler. The traveler is responsible for identifying, supervising, and securing baggage and valuables. Kesher is not a bailee or insurer of baggage and is not responsible for loss, theft, delay, or damage unless caused by Kesher's own legally actionable conduct. Carrier liability and claims are governed by the carrier's rules and applicable law.

Medication, passports, money, jewelry, electronic devices, and other essential or valuable items should be kept in the traveler's personal possession and not placed in checked baggage.

15. ITEMS INCLUDED AND NOT INCLUDED

Only items expressly listed as included in the Tour-Specific Terms are included in the price. Depending on the tour, included items may consist of specified transportation, hotels, meals, sightseeing, admission fees, group transfers, tour escort services, local taxes, and gratuities to specified local service providers.

Unless expressly listed as included, the following are not included: passport and visa costs; travel, medical, cancellation, baggage, or other insurance; vaccinations, tests, and health-document costs; excess baggage charges; personal expenses; laundry; room service; minibar; telephone, internet, television, or similar hotel charges; optional excursions; meals and beverages outside the stated meal plan; independent transfers; and any service not identified as included.

Gratuities for the Kesher tour escort are not included unless expressly stated otherwise. Any suggested gratuity will be stated in the current pre-departure materials. A traveler may voluntarily recognize exceptional service with an additional gratuity.

16. PASSPORTS, VISAS, ENTRY RULES, AND HEALTH REQUIREMENTS

Each traveler is solely responsible for obtaining and carrying the correct passport, visas, transit visas, permits, parental-consent documents, vaccinations, tests, insurance certificates, and other documents required for every destination and transit country.

The name provided for a reservation must match the traveler's passport exactly. A passport must remain valid for the period required by the relevant destination and transit countries, which may be six months or more beyond the travel dates. Requirements vary according to citizenship, residence, itinerary, and personal circumstances and may change without notice.

Travelers must verify current requirements with official government, embassy, consular, health, and carrier sources. Information supplied by Kesher is general assistance and not legal, immigration, or medical advice. Kesher is not responsible when a traveler is denied boarding or entry because the traveler lacks a required document or does not meet an applicable requirement.

17. HEALTH, MOBILITY, ACCESSIBILITY, AND SPECIAL ASSISTANCE

Travelers are responsible for determining, in consultation with an appropriate medical professional when necessary, whether they are fit for the itinerary. Tours may involve long travel days, walking on uneven surfaces, stairs, heat, cold, altitude, limited medical services, or locations that are not accessible to persons with reduced mobility.

A request for an accessibility accommodation or other assistance should be made before booking, or as soon as the need becomes known. Kesher will consider reasonable requests and will communicate them to suppliers, but cannot guarantee facilities or services controlled by independent suppliers or available in foreign destinations. Kesher will not unlawfully discriminate against a traveler with a disability.

Tour escorts, guides, and drivers do not provide personal care, lifting, mobility assistance, or medical services. A traveler who requires such assistance must travel with a qualified companion or arrange appropriate professional support at the traveler's expense.

Kesher may require relevant information about a medical or mobility need only to the extent reasonably necessary to evaluate safety, arrange requested services, or comply with law. Personal information will be handled under Kesher's Privacy Policy and applicable law.

18. TRAVELER CONDUCT AND PARTICIPATION

Travelers must follow reasonable instructions from Kesher, the tour escort, local guides, carriers, hotels, and authorities; arrive on time; respect religious arrangements, fellow travelers, staff, property, and local law; and avoid conduct that endangers, harasses, or materially disrupts others.

Kesher may decline or end a traveler's participation when, based on reasonable grounds, the traveler's conduct presents a safety risk, is unlawful, is abusive or threatening, materially disrupts the tour, or makes continued participation impracticable. When circumstances permit, Kesher will first provide a warning and a reasonable opportunity to correct the conduct.

A traveler removed for serious misconduct is responsible for return travel and related costs. Any refund will be limited to the value Kesher actually recovers for unused services, less costs caused by the traveler's conduct, except where applicable law requires otherwise. Kesher will not remove a traveler solely because of a disability or protected characteristic.

19. TRAVEL INSURANCE

Kesher strongly recommends purchasing comprehensive travel insurance promptly after booking. Coverage should be considered for trip cancellation and interruption, medical care and evacuation, pre-existing conditions, baggage, travel delay, supplier default, and events affecting the traveler's ability to travel.

Insurance is provided by an independent insurer and is governed by the policy wording. Kesher does not guarantee coverage or payment of a claim. The traveler is responsible for reviewing exclusions, coverage limits, claim deadlines, and any time-sensitive requirements.

Kesher's cancellation terms apply regardless of the traveler's reason for cancellation, including illness or family emergency, except where mandatory law or the Tour-Specific Terms provide otherwise.

20. UNUSED OR MISSED SERVICES

After a tour begins, no refund is provided for a meal, transfer, excursion, hotel night, flight, or other service that a traveler voluntarily declines, misses, or cannot use because of late arrival, early departure, inadequate documents, conduct, illness, or another circumstance personal to the traveler.

This section does not apply when a refund is required by law, when Kesher fails to provide a contracted service for a reason within its control, or when the Tour-Specific Terms expressly provide a refund.

21. INDEPENDENT SUPPLIERS

Airlines, hotels, cruise lines, restaurants, caterers, motor-coach companies, drivers, local guides, attractions, and other service providers are independent suppliers. Unless expressly stated otherwise, Kesher does not own, operate, or control them and arranges their services as a tour operator or intermediary.

To the fullest extent permitted by law, Kesher is not responsible for an independent supplier's act, omission, insolvency, breach, negligence, schedule change, or failure to provide a service. This limitation does not apply to Kesher's own negligence in selecting a supplier where such a duty exists, Kesher's own breach of contract, or any liability that applicable law does not permit Kesher to exclude.

Supplier services are subject to the supplier's own lawful terms, tariffs, and conditions of carriage. A supplier term does not eliminate a non-waivable right the traveler has against Kesher.

22. ASSUMPTION OF TRAVEL RISKS

International and group travel involves risks that cannot be eliminated, including transportation accidents, crime, theft, illness, communicable disease, food reactions, differing sanitation or safety standards, uneven terrain, weather, natural events, political conditions, and limited access to medical care.

By choosing to travel after receiving the available itinerary and material disclosures, the traveler knowingly accepts the ordinary and inherent risks of the itinerary, except to the extent an injury or loss is caused by conduct for which liability cannot lawfully be excluded.

Travelers are responsible for reviewing official travel and health advisories and making their own informed decision whether to travel.

23. LIMITATION OF LIABILITY

To the fullest extent permitted by law:

1. Kesher is liable only for direct, proven losses caused by Kesher's own breach of contract, negligence, or other legally actionable conduct.
2. Kesher is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, including loss of enjoyment, lost opportunity, or loss connected with independent arrangements, unless applicable law requires otherwise.
3. For claims other than personal injury or death caused by Kesher's negligence, fraud, gross negligence, willful misconduct, or another claim that cannot legally be limited, Kesher's total liability will not exceed the amount the claimant paid directly to Kesher for the affected travel services.
4. Any recovery is subject to applicable international conventions, statutes, tariffs, and supplier limitations that lawfully apply to the claim.

Nothing in these Terms releases or protects Kesher from liability for its own gross negligence, willful misconduct, fraud, or any other liability that cannot be waived or limited under applicable law.

24. COMPLAINTS AND CLAIMS

A traveler should promptly report a service problem to the tour escort or Kesher so that a reasonable attempt can be made to address it during the trip. If the matter is not resolved, the traveler should submit a written complaint with relevant documents as soon as reasonably possible after the tour.

Failure to report a problem during the tour does not waive a legal right when the traveler could not reasonably have reported it or when applicable law prevents waiver. Kesher may request reasonable documentation needed to investigate the claim.

25. WEBSITE USE

The Website and its content are provided for lawful personal use. Users may not interfere with Website security or operation; introduce malicious code; scrape, copy, or exploit content in violation of law; impersonate another person; submit false information; or use the Website for fraudulent or unlawful activity.

Text, logos, photographs, graphics, itineraries, and other Website content are owned by Kesher or used with permission and are protected by intellectual-property laws. No right to reproduce or commercially use the content is granted except with Kesher's prior written permission or as allowed by law.

Kesher uses reasonable efforts to maintain accurate and available Website content but does not guarantee that the Website will always be uninterrupted, secure, or error-free. Links to third-party websites are provided for convenience. Kesher does not control or endorse third-party content and is not responsible for it.

26. PRIVACY, ELECTRONIC COMMUNICATIONS, AND MARKETING

Kesher collects and uses personal information to respond to inquiries, administer reservations, process payments, communicate travel information, comply with law, and provide requested services. Personal information is handled in accordance with Kesher's separately posted Privacy Policy, which should be read together with these Terms.

By making an inquiry or reservation, the traveler agrees to receive transactional communications reasonably necessary to respond to the inquiry or administer the booking. Transactional consent is not consent to receive marketing.

Marketing emails, texts, or calls will be sent only on the basis permitted by applicable law. Any marketing choice must be separate and voluntary, and the user may withdraw marketing consent using the unsubscribe method provided. Withdrawing marketing consent does not affect a reservation or necessary service communications.

The traveler agrees that booking documents, notices, invoices, and consents may be provided electronically, subject to any non-waivable legal requirements.

27. GOVERNING LAW AND FORUM

These Terms and any dispute arising from the Website or travel services are governed by the laws of the State of New York, without regard to conflict-of-law principles, except to the extent federal law, an international convention, or another mandatory law applies.

The parties consent to the exclusive jurisdiction of the state and federal courts located in New York County, New York. This provision does not prevent a consumer from using a small-claims court with lawful jurisdiction or exercising a right that applicable consumer law does not permit the parties to waive.

Before filing a claim, the parties are encouraged to give each other written notice and a reasonable opportunity to resolve the dispute informally. This informal process does not extend or shorten any legal filing deadline unless the parties agree in writing.

28. GENERAL TERMS

These Terms, together with the booking confirmation and Tour-Specific Terms, are the entire agreement regarding the reservation and replace prior discussions or representations on the same subject. A change or waiver relating to a confirmed booking must be in writing and authorized by Kesher.

If a provision is held invalid or unenforceable, it will be enforced to the maximum extent permitted and the remaining provisions will remain in effect. Kesher's failure to enforce a provision on one occasion is not a waiver on another occasion.

The traveler may not transfer a reservation or rights under it without Kesher's written consent. Kesher may assign its rights and obligations as part of a lawful merger, reorganization, sale of business, or transfer to an affiliated company, provided the traveler's material rights are not reduced.

Kesher may revise the Website-use provisions of these Terms prospectively by posting an updated version and effective date. A confirmed reservation remains governed by the version accepted at booking, together with any later change agreed in writing or required by law.

29. CONTACT

Questions, notices, and complaints concerning these Terms may be directed to:

Kesher Tours, Inc.
209 East 56th Street, #4E
New York, NY 10022
Telephone: 1-212-481-3721 or 1-800-847-0700
Website contact page: https://keshertours.com/contact/`,
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
