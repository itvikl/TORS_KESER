import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import AboutSections from "@/components/marketing/AboutSections";
import { getSiteContent } from "@/lib/data/siteContent";

export const metadata: Metadata = {
  title: "About Us",
  description: "The story, standards, and people behind Keshertours.",
};

export default async function AboutPage() {
  const content = await getSiteContent("about");

  return (
    <div>
      <PageHeader eyebrow={content.eyebrow} title={content.title} lede={content.lede} />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <AboutSections sections={content.sections} />
      </div>
    </div>
  );
}
