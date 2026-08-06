import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import CustomTourForm from "@/components/marketing/CustomTourForm";

export const metadata: Metadata = {
  title: "Custom Made Tours",
  description: "Private kosher tours for your family, friends, or community group.",
};

export default function CustomMadeToursPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Private Group Travel"
        title="A tour built entirely around your group"
        lede="Traveling only with your family, close friends, or community members? We'll design an itinerary just for you — including Roots Tours to your family's ancestral homeland."
      />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <CustomTourForm />
      </div>
    </div>
  );
}
