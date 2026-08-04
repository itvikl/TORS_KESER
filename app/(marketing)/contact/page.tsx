import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Contact Us",
};

// NOTE: form submission is not yet wired to a Server Action / leads
// collection — that lands once Firebase is connected (PRD FR-28).
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

        <form className="glass-panel grid gap-5 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">
            Send us a message
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Telephone" name="phone" type="tel" />
            <Field label="Country" name="country" />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-[#a0b4c4]"
              htmlFor="message"
            >
              Question or Comment
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="glacier-field mt-1.5 w-full"
            />
          </div>
          <button
            type="submit"
            className="justify-self-start rounded-full bg-[#7dd3fc] px-7 py-3 text-sm font-bold text-[#001f2e] transition hover:brightness-110 active:scale-95"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#a0b4c4]" htmlFor={name}>
        {label}
        {required && <span className="text-[#7dd3fc]"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="glacier-field mt-1.5 w-full"
      />
    </div>
  );
}
