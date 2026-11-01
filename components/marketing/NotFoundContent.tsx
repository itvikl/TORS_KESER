import Link from "next/link";
import PageHeader from "@/components/marketing/PageHeader";

/**
 * Body of the site's 404 page. Rendered by app/not-found.tsx (unmatched URLs,
 * which sit outside the marketing layout and so wrap this in it) and by
 * app/(marketing)/not-found.tsx (notFound() thrown from a marketing page, which
 * is already inside that layout — wrapping again would show two headers).
 */
export default function NotFoundContent() {
  return (
    <>
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
    </>
  );
}
