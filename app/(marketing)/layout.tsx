import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0a0e1a] text-[#e0e8f0] selection:bg-[#7dd3fc]/30">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
