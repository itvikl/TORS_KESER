"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setTestimonialDestinationImage } from "@/lib/actions/reviews";
import ImageUploadButton from "@/components/admin/ImageUploadButton";
import { useToast } from "@/components/admin/feedback/AdminFeedbackProvider";

/**
 * Photo per destination card on /testimonials. Destinations come from the
 * reviews themselves (Review.destination, else the tour's first country);
 * without a chosen photo the card uses the most-reviewed tour's hero image.
 */
export default function TestimonialDestinationsPanel({
  destinations,
}: {
  destinations: { slug: string; name: string; image?: string; count: number }[];
}) {
  const router = useRouter();
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const toast = useToast();

  async function save(name: string, slug: string, image?: string) {
    setSavingSlug(slug);
    try {
      await setTestimonialDestinationImage(name, image);
      toast.success(
        image
          ? { title: "Photo updated", description: `New photo set for ${name}.` }
          : { title: "Photo reset", description: `${name} uses the default photo again.` }
      );
    } catch {
      toast.error({ title: "Couldn't save photo", description: "Something went wrong — please try again." });
    }
    setSavingSlug(null);
    router.refresh();
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-ink">Testimonial destinations</h2>
      <p className="mt-1 text-sm text-ink-muted">
        The photo on each destination card of the Testimonials page.
      </p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination) => (
          <li
            key={destination.slug}
            className="flex items-center gap-4 rounded-xl border border-line bg-white p-4"
          >
            {destination.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={destination.image} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="h-16 w-20 shrink-0 rounded-lg bg-sand-warm" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{destination.name}</p>
              <p className="text-xs text-ink-muted">
                {destination.count} letter{destination.count === 1 ? "" : "s"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {savingSlug === destination.slug ? (
                  <span className="text-xs text-ink-muted">Saving…</span>
                ) : (
                  <>
                    <ImageUploadButton
                      label="Change photo"
                      folder="testimonials"
                      onUploaded={(urls) => save(destination.name, destination.slug, urls[0])}
                    />
                    <button
                      type="button"
                      onClick={() => save(destination.name, destination.slug, undefined)}
                      className="text-xs font-medium text-ink-muted hover:text-ink"
                    >
                      Use default
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
