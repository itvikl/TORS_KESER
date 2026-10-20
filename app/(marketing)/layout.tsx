import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import { SitePhoneProvider } from "@/components/marketing/SitePhone";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getSiteSettings } from "@/lib/data/admin/settings";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Google Analytics (the old site's GA4 property), public pages only — not
 * admin. Loads only once NEXT_PUBLIC_SITE_URL is the real domain, so visits
 * to the *.hosted.app backend URL before launch don't pollute the stats.
 */
const GA_MEASUREMENT_ID = new URL(SITE_URL).host.endsWith(".hosted.app")
  ? undefined
  : process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // One read of Admin -> Settings feeds every phone number on the site.
  const { phone } = await getSiteSettings();

  return (
    <SitePhoneProvider phone={phone}>
      <div className="flex min-h-full flex-1 flex-col bg-[var(--color-glacier)] text-[var(--color-mist)] selection:bg-[var(--color-ice)]/30 transition-colors">
        <Header phone={phone} />
        <main className="flex-1">{children}</main>
        <Footer phone={phone} />
      </div>
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </SitePhoneProvider>
  );
}
