import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
};

const FAQS = [
  {
    q: "How is kashrut maintained on tour?",
    a: "Every departure travels with a company mashgiach in addition to local Orthodox Rabbinate or Chabad supervision. Meals are prepared with the group's own utensils where needed, and full details are listed on each tour's page under Kashrut & What to Know.",
  },
  {
    q: "What's included in the price?",
    a: "Hotels, kosher meals, ground transportation, entrance fees, and an English-speaking guide are included. International flights are not included unless stated otherwise — see each tour's Prices & Dates section.",
  },
  {
    q: "How much is the deposit, and when is the balance due?",
    a: "The deposit amount and balance due date vary by tour and are shown clearly on that tour's page before you book.",
  },
  {
    q: "What if the tour doesn't reach minimum group size?",
    a: "Each tour has a minimum number of travelers required to run. If that minimum isn't reached, you'll be notified in advance and offered a full refund.",
  },
  {
    q: "Is this trip suitable for older travelers?",
    a: "Many of our travelers are 50+. Call us at 1-800-847-0700 and we can talk through the pace and physical demands of any specific tour.",
  },
];

export default function FaqPage() {
  return (
    <div>
      <PageHeader title="Frequently Asked Questions" />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="glass-panel group overflow-hidden rounded-xl"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left text-lg font-semibold text-[#e0e8f0] transition-colors hover:bg-white/5 sm:p-6 [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[#7dd3fc] transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="border-t border-[rgba(125,211,252,0.1)] px-5 pb-5 pt-4 text-[15px] leading-7 text-[#a0b4c4] sm:px-6 sm:pb-6">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
