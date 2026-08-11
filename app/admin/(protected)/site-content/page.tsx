import Link from "next/link";
import type { Metadata } from "next";
import type { SiteContentPageKey } from "@/lib/types";

export const metadata: Metadata = { title: "Site Content" };

const PAGES: { pageKey: SiteContentPageKey; label: string; description: string; publicHref: string }[] = [
  { pageKey: "home", label: "Home", description: "Hero, trust signals, and the closing call-to-action.", publicHref: "/" },
  { pageKey: "about", label: "About", description: "Page intro plus every content section.", publicHref: "/about" },
  { pageKey: "custom-tours", label: "Custom Made Tours", description: "Page header above the request form.", publicHref: "/custom-made-tours" },
  { pageKey: "special-offers", label: "Special Offers", description: "Page header above the offers list.", publicHref: "/special-offers" },
  { pageKey: "testimonials", label: "Testimonials", description: "Page header — the quotes themselves come from Reviews.", publicHref: "/testimonials" },
  { pageKey: "faq", label: "FAQ", description: "Page header and every question/answer.", publicHref: "/faq" },
  { pageKey: "contact", label: "Contact", description: "Page header — phone numbers come from Settings.", publicHref: "/contact" },
  { pageKey: "legal-privacy", label: "Privacy Policy", description: "Title and the full policy text.", publicHref: "/legal/privacy" },
  { pageKey: "legal-terms", label: "Terms & Conditions", description: "Title and the full terms text.", publicHref: "/legal/terms-conditions" },
];

export default function SiteContentIndexPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Site Content</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every page in the public site&apos;s navigation, editable here in the same design customers see.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PAGES.map((page) => (
          <Link
            key={page.pageKey}
            href={`/admin/site-content/${page.pageKey}`}
            className="group rounded-xl border border-line bg-white p-5 transition-colors hover:border-navy/40 hover:bg-sand-warm/40"
          >
            <p className="font-semibold text-ink group-hover:text-navy">{page.label}</p>
            <p className="mt-1 text-sm text-ink-muted">{page.description}</p>
            <p className="mt-3 text-xs font-medium text-navy">Edit →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
