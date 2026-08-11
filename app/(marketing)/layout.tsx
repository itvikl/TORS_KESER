import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--color-glacier)] text-[var(--color-mist)] selection:bg-[var(--color-ice)]/30 transition-colors">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
