import Link from "next/link";

const NAV_LINKS = [
  { href: "/tours", label: "Tours" },
  { href: "/about", label: "About" },
  { href: "/custom-made-tours", label: "Custom Tours" },
  { href: "/special-offers", label: "Special Offers" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/blog", label: "Blog" },
];

export default function Header() {
  return (
    <header className="border-b border-line bg-sand/95 backdrop-blur supports-[backdrop-filter]:bg-sand/80 sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <span className="font-display text-2xl font-semibold text-navy">
            Kesher<span className="text-terracotta">tours</span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden lg:flex items-center gap-6 text-[15px] font-medium text-ink-muted"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-terracotta"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href="tel:18008470700"
          className="flex shrink-0 items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-[15px] font-semibold text-sand transition-colors hover:bg-navy-light"
        >
          <span aria-hidden="true">☎</span>
          <span className="hidden sm:inline">1-800-847-0700</span>
          <span className="sm:hidden">Call Now</span>
        </a>
      </div>
    </header>
  );
}
