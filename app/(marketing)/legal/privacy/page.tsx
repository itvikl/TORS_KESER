import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import { getSiteContent } from "@/lib/data/siteContent";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default async function PrivacyPage() {
  const content = await getSiteContent("legal-privacy");

  return (
    <div>
      <PageHeader eyebrow="Legal" title={content.title} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="glass-panel rounded-2xl p-6 sm:p-8">
          <p className="whitespace-pre-line text-[15px] leading-7 text-[#a0b4c4]">
            {content.body}
          </p>
        </section>
      </div>
    </div>
  );
}
