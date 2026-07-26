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
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <form className="grid gap-4 rounded-2xl border border-line bg-white/60 p-6">
          <h2 className="font-display text-xl font-semibold text-navy">
            Tell us about your group
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="destination">
                Destination
              </label>
              <input
                id="destination"
                name="destination"
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="groupSize">
                Approximate group size
              </label>
              <input
                id="groupSize"
                name="groupSize"
                type="number"
                min={1}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px]"
            />
          </div>
          <button
            type="submit"
            className="justify-self-start rounded-lg bg-terracotta px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-terracotta-dark"
          >
            Request a Custom Tour
          </button>
        </form>
      </div>
    </div>
  );
}
