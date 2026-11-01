import type { Metadata } from "next";
import NotFoundContent from "@/components/marketing/NotFoundContent";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * notFound() from a marketing page (e.g. an unknown or unpublished tour slug).
 * Already inside the (marketing) layout, so this renders the body only — the
 * header and footer come from the layout, once.
 */
export default function MarketingNotFound() {
  return <NotFoundContent />;
}
