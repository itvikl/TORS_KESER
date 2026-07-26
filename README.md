# Keshertours

Rebuild of [keshertours.com](https://keshertours.com) — a kosher tour operator selling escorted tours worldwide to an American audience. This repo is the new site: a full booking-and-payments platform (catalog, tour pages, online deposit/balance payments, customer account area, and an admin back-office), replacing the existing WordPress site while preserving its SEO footprint.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Firebase** — Firestore (data), Auth (customers/staff), Storage (media)
- **Stripe** — deposit/balance payments (webhook-confirmed; see `lib/stripe/`)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). (If that port is taken, Next.js will pick the next free one — check the terminal output.)

### Environment variables

Copy `.env.local.example` to `.env.local` and fill in real values:

```bash
cp .env.local.example .env.local
```

Firebase and Stripe credentials are required for anything beyond the public marketing pages (auth, booking, admin). Until those are configured, tour/departure data is served from the seed file at `lib/data/tours.ts` rather than Firestore.

## Project structure

```
app/
  (marketing)/     public site — home, /tours, /tours/[slug], about, contact, etc.
  (booking)/       booking flow (not yet built)
  (account)/       customer account area (not yet built)
  (admin)/         back-office (not yet built)
components/
  marketing/       public-site UI, including TourPageView — the pure,
                    props-only tour page component shared between the
                    public route and the admin editor's live preview
  ui/              small shared primitives (e.g. SafeImage)
lib/
  types/           shared TypeScript types mirroring the Firestore data model
  firebase/        client SDK (browser-safe) vs admin SDK (server-only)
  stripe/          same client/server split
  data/             temporary in-memory seed data standing in for Firestore
  cancellationPolicy.ts   cancellation-policy display calculator
  pricing.ts        room-configuration price calculator (double/single/triple)
```

## Current status

The public marketing pages render with real content seeded from the existing site. Booking/payment, the customer account area, and the admin back-office are not yet implemented — they're specified but depend on a connected Firebase project and Stripe account.

**Explicitly out of scope for now:** refund processing. Cancellation policy text is shown to customers before payment, but no refund calculation or execution is wired up (see the PRD for details).
