import Link from "next/link";
import BrandLogo from "@/components/marketing/BrandLogo";

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
    <footer className="border-t border-white/5 bg-[#0a0e1a]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <BrandLogo className="h-12 w-auto object-contain" />
            <p className="mt-3 text-sm text-[#a0b4c4]">
              Travel the world the Jewish way.
            </p>
            <a
              href="tel:18008470700"
              className="mt-4 inline-block text-sm font-semibold text-[#7dd3fc] transition-colors hover:brightness-110"
            >
              1-800-847-0700
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0b4c4]">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#e0e8f0]/80 transition-colors hover:text-[#7dd3fc]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/5 pt-6 text-xs text-[#a0b4c4]/60 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Keshertours. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/legal/terms-conditions" className="transition-colors hover:text-[#7dd3fc]">
              Terms &amp; Conditions
            </Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-[#7dd3fc]">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
