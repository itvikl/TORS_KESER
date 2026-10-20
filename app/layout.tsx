import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/siteUrl";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Keshertours — Travel the World the Jewish Way",
    template: "%s | Keshertours",
  },
  description:
    "Kosher tours to destinations worldwide — escorted, fully kosher, and built for travelers who want to see the world without compromise.",
  openGraph: {
    type: "website",
    siteName: "Keshertours",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  // Search Console ownership, carried over from the old WordPress homepage —
  // losing these at launch would unverify the existing properties.
  verification: {
    other: {
      "google-site-verification": [
        "TdFynJjeRCDciTnwEqD3BqcV90AxzX0WY062w7XMlkI",
        "n-i_0Ps3Ho88FTKXVUln1KLIE3U0T_ymJVR51bUZTio",
      ],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-[var(--color-glacier)] font-body text-[var(--color-mist)]">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
