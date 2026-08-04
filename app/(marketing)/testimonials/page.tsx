import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "What travelers say after touring with Keshertours.",
};

// Seeded from the existing site's testimonials (names/ratings not shown
// there today — PRD flags this as an upgrade opportunity for the new site).
const TESTIMONIALS = [
  {
    destination: "Costa Rica",
    quote:
      "Just wanted to thank you for your hard work in making The Costa Rica Experience a positive experience.",
  },
  {
    destination: "Peru",
    quote:
      "The organization of the tour was excellent. Your concern for the travelers' welfare, attention to detail and commitment to schedules were outstanding.",
  },
  {
    destination: "Japan",
    quote:
      "Menachem, your warmth, concern and patience for all of us should serve as a paradigm for tour guides everywhere.",
  },
  {
    destination: "Morocco",
    quote:
      "We can't thank you enough for making this trip such a memorable and meaningful one.",
  },
  {
    destination: "Spain & Portugal",
    quote: "This was our first trip with Shai Bar Ilan and it was a very positive experience.",
  },
  {
    destination: "Australia & New Zealand",
    quote: "We just want to tell you how much we enjoyed our tour to Australia and New Zealand.",
  },
];

export default function TestimonialsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="From Our Travelers"
        title="Testimonials"
        lede="Real feedback from recent Keshertours departures."
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.destination + t.quote.slice(0, 10)}
            className="rounded-3xl border border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.6)] p-6 shadow-2xl backdrop-blur-lg transition-all duration-300 hover:border-[rgba(125,211,252,0.2)] hover:bg-[rgba(15,21,36,0.75)] sm:p-8"
          >
            <blockquote className="text-[15px] leading-7 text-[#e0e8f0]">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">
              {t.destination}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
