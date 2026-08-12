import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import { getSiteContent } from "@/lib/data/siteContent";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default async function TermsConditionsPage() {
  const content = await getSiteContent("legal-terms");

  return (
    <div>
      <PageHeader eyebrow="Legal" title={content.title} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="glass-panel rounded-2xl p-6 sm:p-8">
          <p className="whitespace-pre-line text-[15px] leading-7 text-[var(--color-slate)]">
            {content.body}
          </p>
        </section>
      </div>
    </div>
  );
}
