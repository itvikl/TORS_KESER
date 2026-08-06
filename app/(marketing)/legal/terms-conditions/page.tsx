import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsConditionsPage() {
  return (
    <div>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="glass-panel rounded-2xl p-6 sm:p-8">
          <p className="rounded-xl border border-dashed border-[rgba(125,211,252,0.2)] bg-white/5 p-4 text-[15px] leading-7 text-[#a0b4c4]">
            This page needs real content from the client: booking terms,
            liability disclosures, and the cancellation policy in full legal
            language (the cancellation charge tiers themselves are already
            implemented — see the Cancellation Policy shown during
            registration). Until this is published, staff should not rely on
            this page as a binding terms document.
          </p>
        </section>
      </div>
    </div>
  );
}
