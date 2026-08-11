import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import FaqList from "@/components/marketing/FaqList";
import { getSiteContent } from "@/lib/data/siteContent";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
};

export default async function FaqPage() {
  const content = await getSiteContent("faq");

  return (
    <div>
      <PageHeader title={content.title} lede={content.lede} />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <FaqList items={content.items} />
      </div>
    </div>
  );
}
