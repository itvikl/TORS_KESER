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
      <div className="mx-auto grid max-w-3xl gap-8 px-4 py-14 sm:px-6">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-sand-warm p-6 text-center">
          <p className="text-sm text-ink-muted">Prefer to talk?</p>
          <a href="tel:18008470700" className="font-display text-2xl font-semibold text-navy">
            1-800-847-0700
          </a>
          <a href="tel:12124813721" className="text-sm text-ink-muted">
            or 1-212-481-3721
          </a>
        </div>

        <form className="grid gap-4 rounded-2xl border border-line bg-white/60 p-6">
          <h2 className="font-display text-xl font-semibold text-navy">Send us a message</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Telephone" name="phone" type="tel" />
            <Field label="Country" name="country" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="message">
              Question or Comment
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px]"
            />
          </div>
          <button
            type="submit"
            className="justify-self-start rounded-lg bg-terracotta px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-terracotta-dark"
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
      <label className="block text-sm font-medium text-ink" htmlFor={name}>
        {label}
        {required && <span className="text-terracotta"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px]"
      />
    </div>
  );
}
