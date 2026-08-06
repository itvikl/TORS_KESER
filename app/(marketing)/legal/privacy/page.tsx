import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="glass-panel rounded-2xl p-6 sm:p-8">
          <p className="rounded-xl border border-dashed border-[rgba(125,211,252,0.2)] bg-white/5 p-4 text-[15px] leading-7 text-[#a0b4c4]">
            This page needs real content from the client: what personal and
            payment data is collected (registration forms, Stripe checkout),
            how it is stored (Firebase), and how travelers can request its
            deletion. Until this is published, staff should not rely on this
            page as a binding privacy policy.
          </p>
        </section>
      </div>
    </div>
  );
}
