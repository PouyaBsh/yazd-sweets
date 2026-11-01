import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { BootLoader } from "@/components/layout/BootLoader";
import { NoiseOverlay } from "@/components/ui/NoiseOverlay";
import { HERO_CONTENT } from "@/data/yazd-content";
import "./globals.css";

/**
 * Vazirmatn FD (Persian digits), self-hosted and subset to the Persian + Latin glyphs this site uses
 * (~22 KB per weight instead of ~49 KB, and no render-blocking stylesheet from a third-party CDN —
 * which is slow or unreachable on many Iranian networks). SIL OFL — see ./fonts/Vazirmatn-OFL.txt.
 */
const vazirmatn = localFont({
  src: [
    { path: "./fonts/Vazirmatn-FD-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Vazirmatn-FD-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Vazirmatn-FD-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Vazirmatn-FD-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Vazirmatn-FD-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "./fonts/Vazirmatn-FD-Black.woff2", weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-vazirmatn",
  preload: true,
  fallback: ["Tahoma", "sans-serif"],
});

export const metadata: Metadata = {
  title: "شیرینی‌ها و سوغات اصیل یزد",
  description: HERO_CONTENT.tagline,
  keywords: ["یزد", "شیرینی یزدی", "قطاب", "باقلوا", "پشمک", "لوز", "حاجی بادام", "کیک یزدی", "قهوه یزدی"],
  openGraph: {
    title: "شیرینی‌ها و سوغات اصیل یزد",
    description: HERO_CONTENT.tagline,
    locale: "fa_IR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth" data-booting="" className={vazirmatn.variable} suppressHydrationWarning>
      <body className="min-h-[100dvh] w-full max-w-full bg-canvas font-sans text-ink antialiased">
        <BootLoader />
        {children}
        <NoiseOverlay />
      </body>
    </html>
  );
}
