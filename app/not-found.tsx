import type { Metadata } from "next";
import MarketingLayout from "./(marketing)/layout";
import NotFoundContent from "@/components/marketing/NotFoundContent";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * Site-wide 404 for URLs that match no route at all. The root boundary renders
 * outside the (marketing) layout, so it brings the site header/footer itself.
 * A notFound() thrown from a marketing page (an unknown tour or post slug) is
 * handled by app/(marketing)/not-found.tsx instead, already inside the layout.
 */
export default function NotFound() {
  return (
    <MarketingLayout>
      <NotFoundContent />
    </MarketingLayout>
  );
}
