import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Keshertours — Travel the World the Jewish Way",
    template: "%s | Keshertours",
  },
  description:
    "Kosher tours to destinations worldwide — escorted, fully kosher, and built for travelers who want to see the world without compromise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#0a0e1a] font-body text-[#e0e8f0]">
        {children}
      </body>
    </html>
  );
}
