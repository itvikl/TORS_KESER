import Link from "next/link";
import BrandLogo from "@/components/marketing/BrandLogo";

// Country names must match lib/countries.ts's COUNTRIES exactly — these
// deep-link into the homepage's existing country filter (TourFilterProvider).
// A small curated sample (not the full catalog) — update if the featured
// destinations change.
const COLUMNS = [
  {
    title: "Destinations",
    links: [
      { href: "/?country=Israel#featured-tours", label: "Israel" },
      { href: "/?country=Italy#featured-tours", label: "Italy" },
      { href: "/?country=Costa%20Rica#featured-tours", label: "Costa Rica" },
      { href: "/?country=Morocco#featured-tours", label: "Morocco" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/testimonials", label: "Testimonials" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-hairline-faint)] bg-[var(--color-glacier)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <BrandLogo className="h-12 w-auto object-contain" />
            <p className="mt-3 text-sm text-[var(--color-slate)]">
              Travel the world the Jewish way.
            </p>
            <a
              href="tel:18008470700"
              className="mt-4 inline-block text-sm font-semibold text-[var(--color-ice)] transition-colors hover:brightness-110"
            >
              1-800-847-0700
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-slate)]">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-mist)]/80 transition-colors hover:text-[var(--color-ice)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--color-border-hairline-faint)] pt-6 text-xs text-[var(--color-slate)]/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <p>&copy; {new Date().getFullYear()} Keshertours. All rights reserved.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-shai-header-fial.jpg"
              alt="Shai Bar Ilan Geographical Tours"
              className="h-8 w-auto rounded-md object-contain opacity-90"
            />
          </div>
          <div className="flex gap-4">
            <Link href="/legal/terms-conditions" className="transition-colors hover:text-[var(--color-ice)]">
              Terms &amp; Conditions
            </Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-[var(--color-ice)]">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
