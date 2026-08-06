import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import ContactForm from "@/components/marketing/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <div>
      <PageHeader
        title="Contact Us"
        lede="Call anytime, or send us your travel plans and we'll get back to you."
      />
      <div className="mx-auto grid max-w-3xl gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass-panel flex flex-col items-center gap-2 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">
            Prefer to talk?
          </p>
          <a
            href="tel:18008470700"
            className="font-display text-3xl font-bold text-[#e0e8f0] transition hover:text-[#7dd3fc]"
          >
            1-800-847-0700
          </a>
          <a
            href="tel:12124813721"
            className="text-sm text-[#a0b4c4] transition hover:text-[#7dd3fc]"
          >
            or 1-212-481-3721
          </a>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
