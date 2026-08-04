import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "About Us",
  description: "The story, standards, and people behind Keshertours.",
};

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        eyebrow="About Keshertours"
        title="Travel the world without leaving anything behind"
        lede="Every Keshertours departure is planned so you never have to choose between seeing the world and keeping the standards you keep at home."
      />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="glass-panel rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#7dd3fc]">
            Our Approach
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#a0b4c4]">
            Every tour is escorted by a Shomer Shabbat, English-speaking
            guide, and travels with a company mashgiach in addition to
            local rabbinic or Chabad supervision — kashrut isn&apos;t an
            afterthought bolted onto a standard itinerary, it&apos;s
            planned in from the first day.
          </p>
        </section>

        <section className="mt-8 glass-panel rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#7dd3fc]">
            [Company history — years in business, licensing]
          </h2>
          <p className="mt-4 rounded-xl border border-dashed border-[rgba(125,211,252,0.2)] bg-white/5 p-4 text-[15px] leading-7 text-[#a0b4c4]">
            This section needs real content from the client: founding
            year, Seller of Travel registration numbers (see PRD Q4),
            and any industry affiliations — these are trust signals that
            matter most to this audience and are currently missing from
            the live site as well.
          </p>
        </section>

        <section className="mt-8 glass-panel rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#7dd3fc]">
            [Leadership — Shai Bar Ilan / guide bios]
          </h2>
          <p className="mt-4 rounded-xl border border-dashed border-[rgba(125,211,252,0.2)] bg-white/5 p-4 text-[15px] leading-7 text-[#a0b4c4]">
            Placeholder for a short bio and photo — testimonials on the
            existing site reference trips personally led by Shai Bar
            Ilan, which is exactly the kind of detail that builds trust
            with a 50+ audience.
          </p>
        </section>
      </div>
    </div>
  );
}
