import Link from "next/link";
import BrandLogo from "@/components/marketing/BrandLogo";

const NAV_LINKS = [
  { href: "/#featured-tours", label: "Tours" },
  { href: "/about", label: "About" },
  { href: "/custom-made-tours", label: "Custom Tours" },
  { href: "/special-offers", label: "Special Offers" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(15,21,36,0.85)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(15,21,36,0.9)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8">
        <BrandLogo className="h-11 w-auto object-contain sm:h-12 lg:h-14" />

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-white/80 transition-colors hover:text-[#7dd3fc]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href="tel:18008470700"
          className="flex shrink-0 items-center gap-2 rounded-full bg-[#7dd3fc] px-3 py-2 text-[14px] font-bold text-[#001f2e] transition-all hover:brightness-110 active:scale-95 sm:px-4 sm:py-2.5 sm:text-[15px]"
        >
          <span aria-hidden="true">☎</span>
          <span className="hidden sm:inline">1-800-847-0700</span>
          <span className="sm:hidden">Call</span>
        </a>
      </div>
    </header>
  );
}
