import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteContent } from "@/lib/data/siteContent";
import { getSiteSettings } from "@/lib/data/admin/settings";
import type { SiteContentPageKey } from "@/lib/types";
import HomeContentForm from "@/components/admin/siteContent/HomeContentForm";
import AboutContentForm from "@/components/admin/siteContent/AboutContentForm";
import FaqContentForm from "@/components/admin/siteContent/FaqContentForm";
import ContactContentForm from "@/components/admin/siteContent/ContactContentForm";
import SimplePageContentForm from "@/components/admin/siteContent/SimplePageContentForm";
import LegalContentForm from "@/components/admin/siteContent/LegalContentForm";
import {
  saveCustomToursContent,
  saveSpecialOffersContent,
  saveTestimonialsContent,
  saveLegalPrivacyContent,
  saveLegalTermsContent,
} from "@/lib/actions/siteContent";

const PAGE_KEYS: SiteContentPageKey[] = [
  "home",
  "about",
  "custom-tours",
  "special-offers",
  "testimonials",
  "faq",
  "contact",
  "legal-privacy",
  "legal-terms",
];

const PAGE_LABELS: Record<SiteContentPageKey, string> = {
  home: "Home",
  about: "About",
  "custom-tours": "Custom Made Tours",
  "special-offers": "Special Offers",
  testimonials: "Testimonials",
  faq: "FAQ",
  contact: "Contact",
  "legal-privacy": "Privacy Policy",
  "legal-terms": "Terms & Conditions",
};

function isSiteContentPageKey(value: string): value is SiteContentPageKey {
  return (PAGE_KEYS as string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageKey: string }>;
}): Promise<Metadata> {
  const { pageKey } = await params;
  return { title: isSiteContentPageKey(pageKey) ? PAGE_LABELS[pageKey] : "Site Content" };
}

export default async function SiteContentEditorPage({
  params,
}: {
  params: Promise<{ pageKey: string }>;
}) {
  const { pageKey } = await params;
  if (!isSiteContentPageKey(pageKey)) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/site-content" className="text-sm font-medium text-navy hover:text-navy-light">
          ← Site Content
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">{PAGE_LABELS[pageKey]}</h1>
      </div>

      <EditorForm pageKey={pageKey} />
    </div>
  );
}

async function EditorForm({ pageKey }: { pageKey: SiteContentPageKey }) {
  switch (pageKey) {
    case "home": {
      const content = await getSiteContent("home");
      return <HomeContentForm initialContent={content} />;
    }
    case "about": {
      const content = await getSiteContent("about");
      return <AboutContentForm initialContent={content} />;
    }
    case "custom-tours": {
      const content = await getSiteContent("custom-tours");
      return <SimplePageContentForm initialContent={content} saveAction={saveCustomToursContent} />;
    }
    case "special-offers": {
      const content = await getSiteContent("special-offers");
      return <SimplePageContentForm initialContent={content} saveAction={saveSpecialOffersContent} />;
    }
    case "testimonials": {
      const content = await getSiteContent("testimonials");
      return <SimplePageContentForm initialContent={content} saveAction={saveTestimonialsContent} />;
    }
    case "faq": {
      const content = await getSiteContent("faq");
      return <FaqContentForm initialContent={content} />;
    }
    case "contact": {
      const [content, settings] = await Promise.all([getSiteContent("contact"), getSiteSettings()]);
      return (
        <ContactContentForm
          initialContent={content}
          primaryPhone={settings.phone}
          secondaryPhone={settings.phoneAlt}
        />
      );
    }
    case "legal-privacy": {
      const content = await getSiteContent("legal-privacy");
      return <LegalContentForm initialContent={content} saveAction={saveLegalPrivacyContent} />;
    }
    case "legal-terms": {
      const content = await getSiteContent("legal-terms");
      return <LegalContentForm initialContent={content} saveAction={saveLegalTermsContent} />;
    }
  }
}
