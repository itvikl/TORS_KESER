import type { Metadata } from "next";
import Link from "next/link";
import MarketingLayout from "./(marketing)/layout";
import PageHeader from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * Site-wide 404 — for unmatched URLs and notFound() from any page (an
 * unknown tour or post slug). The root boundary renders outside the
 * (marketing) layout, so it brings the site header/footer itself.
 */
export default function NotFound() {
  return (
    <MarketingLayout>
      <PageHeader
        eyebrow="404"
        title="We couldn't find that page"
        lede="It may have moved, or the tour may no longer be running. Browse our current tours or get in touch."
      />
      <div className="flex flex-wrap justify-center gap-4 px-4 py-14">
        <Link
          href="/#featured-tours"
          className="rounded-full bg-[var(--color-ice)] px-6 py-3 text-sm font-semibold text-[var(--color-glacier)] transition hover:opacity-90"
        >
          Browse tours
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-[var(--color-border-ice-strong)] px-6 py-3 text-sm font-semibold text-[var(--color-mist)] transition hover:border-[var(--color-ice)]"
        >
          Contact us
        </Link>
      </div>
    </MarketingLayout>
  );
}
