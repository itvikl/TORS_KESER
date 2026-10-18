import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import { SitePhoneProvider } from "@/components/marketing/SitePhone";
import { getSiteSettings } from "@/lib/data/admin/settings";

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
    </SitePhoneProvider>
  );
}
