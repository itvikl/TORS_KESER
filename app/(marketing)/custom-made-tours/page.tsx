import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import CustomTourForm from "@/components/marketing/CustomTourForm";
import { getSiteContent } from "@/lib/data/siteContent";

export const metadata: Metadata = {
  title: "Custom Made Tours",
  description: "Private kosher tours for your family, friends, or community group.",
};

export default async function CustomMadeToursPage() {
  const content = await getSiteContent("custom-tours");

  return (
    <div>
      <PageHeader eyebrow={content.eyebrow} title={content.title} lede={content.lede} />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <CustomTourForm />
      </div>
    </div>
  );
}
