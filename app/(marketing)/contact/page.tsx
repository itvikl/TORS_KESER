import type { Metadata } from "next";
import PageHeader from "@/components/marketing/PageHeader";
import ContactForm from "@/components/marketing/ContactForm";
import { getSiteContent } from "@/lib/data/siteContent";
// Phone numbers are the site's single Settings doc (already admin-editable
// at /admin/settings), not duplicated as their own site-content fields.
import { getSiteSettings } from "@/lib/data/admin/settings";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default async function ContactPage() {
  const [content, settings] = await Promise.all([getSiteContent("contact"), getSiteSettings()]);

  return (
    <div>
      <PageHeader title={content.title} lede={content.lede} />
      <div className="mx-auto grid max-w-3xl gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass-panel flex flex-col items-center gap-2 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">
            Prefer to talk?
          </p>
          <a
            href={`tel:${settings.phone.replace(/\D/g, "")}`}
            className="font-display text-3xl font-bold text-[#e0e8f0] transition hover:text-[#7dd3fc]"
          >
            {settings.phone}
          </a>
          {settings.phoneAlt && (
            <a
              href={`tel:${settings.phoneAlt.replace(/\D/g, "")}`}
              className="text-sm text-[#a0b4c4] transition hover:text-[#7dd3fc]"
            >
              or {settings.phoneAlt}
            </a>
          )}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
