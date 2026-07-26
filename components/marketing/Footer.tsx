import Link from "next/link";

const COLUMNS = [
  {
    title: "Destinations",
    links: [
      { href: "/tours-destinations/south-america", label: "South America" },
      { href: "/tours-destinations/europe", label: "Europe" },
      { href: "/tours-destinations/asia", label: "Asia" },
      { href: "/tours-destinations/africa", label: "Africa" },
    ],
  },
  {
    title: "Travel Style",
    links: [
      { href: "/tours-types/land-tours", label: "Land Tours" },
      { href: "/tours-types/luxury-tours", label: "Luxury Tours" },
      { href: "/tours-types/cruises-premium", label: "Premium & Cruises" },
      { href: "/tours-types/seminars", label: "Seminars" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/testimonials", label: "Testimonials" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-sand-warm">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <span className="font-display text-xl font-semibold text-navy">
              Kesher<span className="text-terracotta">tours</span>
            </span>
            <p className="mt-3 text-sm text-ink-muted">
              Travel the world the Jewish way.
            </p>
            <a
              href="tel:18008470700"
              className="mt-4 inline-block text-sm font-semibold text-navy"
            >
              1-800-847-0700
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink transition-colors hover:text-terracotta"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Keshertours. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/legal/terms-conditions" className="hover:text-terracotta">
              Terms &amp; Conditions
            </Link>
            <Link href="/legal/privacy" className="hover:text-terracotta">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
