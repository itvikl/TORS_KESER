import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";

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
        <form className="glass-panel grid gap-5 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-[#e0e8f0]">
            Tell us about your group
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="block text-sm font-medium text-[#a0b4c4]"
                htmlFor="destination"
              >
                Destination
              </label>
              <input
                id="destination"
                name="destination"
                className="glacier-field mt-1.5 w-full"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-[#a0b4c4]"
                htmlFor="groupSize"
              >
                Approximate group size
              </label>
              <input
                id="groupSize"
                name="groupSize"
                type="number"
                min={1}
                className="glacier-field mt-1.5 w-full"
              />
            </div>
          </div>
          <div>
            <label
              className="block text-sm font-medium text-[#a0b4c4]"
              htmlFor="phone"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="glacier-field mt-1.5 w-full"
            />
          </div>
          <button
            type="submit"
            className="justify-self-start rounded-full bg-[#7dd3fc] px-7 py-3 text-sm font-bold text-[#001f2e] transition hover:brightness-110 active:scale-95"
          >
            Request a Custom Tour
          </button>
        </form>
      </div>
    </div>
  );
}
